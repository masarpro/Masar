import { db, getOrganizationMembership } from "@repo/database";
import type { Permissions } from "@repo/database/prisma/permissions";
import {
	getUserPermissions,
	getUserProjectScope,
	getUserRoleType,
} from "./get-user-permissions";

/**
 * Short-lived, process-local cache for the two DB queries that run on the
 * critical path of EVERY authenticated RPC call:
 *   - organization membership  (db.member.findUnique + organization)
 *   - effective permissions    (db.user.findUnique + organizationRole)
 *
 * Why this exists: with Vercel(Dubai) ↔ Supabase(Mumbai) at ~20-30ms/query,
 * and a single page firing several RPC calls, these two uncached queries were
 * repeated per call and dominated navigation latency.
 *
 * Safety:
 *   - TTL is intentionally short (membership/permissions rarely change mid-session).
 *   - Keyed ALWAYS by (organizationId, userId) → no cross-tenant bleed. The
 *     cross-tenant guard inside getUserPermissions still runs on every miss.
 *   - DENY results (null membership / empty permissions) are cached too — caching
 *     a deny is safe; it only delays a freshly-granted access by up to one TTL,
 *     and grant paths (create/update org-user, role edits) call invalidateAccessCache.
 *   - Per-instance only; not shared across serverless instances. Each instance
 *     converges within one TTL even without explicit invalidation.
 */

const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

type Entry<T> = { value: T; expires: number };

type Membership = Awaited<ReturnType<typeof getOrganizationMembership>>;

type ProjectScope = Awaited<ReturnType<typeof getUserProjectScope>>;

const membershipCache = new Map<string, Entry<Membership>>();
const permissionsCache = new Map<string, Entry<Permissions>>();
const projectScopeCache = new Map<string, Entry<ProjectScope>>();
const roleTypeCache = new Map<string, Entry<string | null>>();

type ProjectAccessRow = {
	id: string;
	name: string;
	slug: string;
	organizationId: string;
} | null;

const projectRowCache = new Map<string, Entry<ProjectAccessRow>>();

function cacheKey(organizationId: string, userId: string): string {
	return `${organizationId}:${userId}`;
}

function read<T>(cache: Map<string, Entry<T>>, key: string): Entry<T> | undefined {
	const hit = cache.get(key);
	if (!hit) {
		return undefined;
	}
	if (hit.expires < Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return hit;
}

function write<T>(cache: Map<string, Entry<T>>, key: string, value: T): void {
	// Cheap unbounded-growth guard: a runaway instance just resets the cache.
	if (cache.size >= MAX_ENTRIES) {
		cache.clear();
	}
	cache.set(key, { value, expires: Date.now() + TTL_MS });
}

export async function getCachedOrganizationMembership(
	organizationId: string,
	userId: string,
): Promise<Membership> {
	const key = cacheKey(organizationId, userId);
	const hit = read(membershipCache, key);
	if (hit) {
		return hit.value;
	}
	const value = await getOrganizationMembership(organizationId, userId);
	write(membershipCache, key, value);
	return value;
}

export async function getCachedUserPermissions(
	userId: string,
	organizationId: string,
): Promise<Permissions> {
	const key = cacheKey(organizationId, userId);
	const hit = read(permissionsCache, key);
	if (hit) {
		return hit.value;
	}
	const value = await getUserPermissions(userId, organizationId);
	write(permissionsCache, key, value);
	return value;
}

export async function getCachedUserRoleType(
	userId: string,
	organizationId: string,
): Promise<string | null> {
	const key = cacheKey(organizationId, userId);
	const hit = read(roleTypeCache, key);
	if (hit) {
		return hit.value;
	}
	const value = await getUserRoleType(userId, organizationId);
	write(roleTypeCache, key, value);
	return value;
}

export async function getCachedUserProjectScope(
	userId: string,
	organizationId: string,
): Promise<ProjectScope> {
	const key = cacheKey(organizationId, userId);
	const hit = read(projectScopeCache, key);
	if (hit) {
		return hit.value;
	}
	const value = await getUserProjectScope(userId, organizationId);
	write(projectScopeCache, key, value);
	return value;
}

/**
 * Minimal, org-scoped project lookup for verifyProjectAccess. Replaces the
 * uncached getProjectById (which also joined createdBy + coverPhoto) on the
 * hot path of every project-scoped RPC. Staleness tradeoffs: a renamed
 * project shows the old name in audit metadata for ≤TTL; a deleted project
 * passes the existence check for ≤TTL but every handler query is still
 * scoped by projectId+organizationId and just returns empty.
 */
export async function getCachedProjectForAccess(
	projectId: string,
	organizationId: string,
): Promise<ProjectAccessRow> {
	const key = `${organizationId}:${projectId}`;
	const hit = read(projectRowCache, key);
	if (hit) {
		return hit.value;
	}
	const value = await db.project.findFirst({
		where: { id: projectId, organizationId },
		select: { id: true, name: true, slug: true, organizationId: true },
	});
	write(projectRowCache, key, value);
	return value;
}

/**
 * Drop cached membership/permissions so a role/permission/isActive change takes
 * effect on the very next request instead of waiting out the TTL.
 *
 * @param organizationId scope to invalidate
 * @param userId         if provided, only that user; otherwise every cached user
 *                       in the organization (use for role-definition edits that
 *                       affect many users at once).
 */
export function invalidateAccessCache(
	organizationId: string,
	userId?: string,
): void {
	if (userId) {
		const key = cacheKey(organizationId, userId);
		membershipCache.delete(key);
		permissionsCache.delete(key);
		projectScopeCache.delete(key);
		roleTypeCache.delete(key);
		return;
	}

	const prefix = `${organizationId}:`;
	for (const key of membershipCache.keys()) {
		if (key.startsWith(prefix)) {
			membershipCache.delete(key);
		}
	}
	for (const key of permissionsCache.keys()) {
		if (key.startsWith(prefix)) {
			permissionsCache.delete(key);
		}
	}
	for (const key of projectScopeCache.keys()) {
		if (key.startsWith(prefix)) {
			projectScopeCache.delete(key);
		}
	}
	for (const key of roleTypeCache.keys()) {
		if (key.startsWith(prefix)) {
			roleTypeCache.delete(key);
		}
	}
}
