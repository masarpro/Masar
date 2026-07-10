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

// In-flight promise maps (single-flight): a page prefetching several RPCs in
// parallel had every call miss the cache simultaneously and stampede the DB
// with identical queries. Sharing the pending promise collapses N concurrent
// misses into 1 query.
const membershipInflight = new Map<string, Promise<Membership>>();
const permissionsInflight = new Map<string, Promise<Permissions>>();
const projectScopeInflight = new Map<string, Promise<ProjectScope>>();
const roleTypeInflight = new Map<string, Promise<string | null>>();
const projectRowInflight = new Map<string, Promise<ProjectAccessRow>>();

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

function withSingleFlight<T>(
	cache: Map<string, Entry<T>>,
	inflight: Map<string, Promise<T>>,
	key: string,
	load: () => Promise<T>,
): Promise<T> {
	const hit = read(cache, key);
	if (hit) {
		return Promise.resolve(hit.value);
	}
	const pending = inflight.get(key);
	if (pending) {
		return pending;
	}
	const promise = load()
		.then((value) => {
			write(cache, key, value);
			return value;
		})
		.finally(() => {
			inflight.delete(key);
		});
	inflight.set(key, promise);
	return promise;
}

export async function getCachedOrganizationMembership(
	organizationId: string,
	userId: string,
): Promise<Membership> {
	const key = cacheKey(organizationId, userId);
	return withSingleFlight(membershipCache, membershipInflight, key, () =>
		getOrganizationMembership(organizationId, userId),
	);
}

export async function getCachedUserPermissions(
	userId: string,
	organizationId: string,
): Promise<Permissions> {
	const key = cacheKey(organizationId, userId);
	return withSingleFlight(permissionsCache, permissionsInflight, key, () =>
		getUserPermissions(userId, organizationId),
	);
}

export async function getCachedUserRoleType(
	userId: string,
	organizationId: string,
): Promise<string | null> {
	const key = cacheKey(organizationId, userId);
	return withSingleFlight(roleTypeCache, roleTypeInflight, key, () =>
		getUserRoleType(userId, organizationId),
	);
}

export async function getCachedUserProjectScope(
	userId: string,
	organizationId: string,
): Promise<ProjectScope> {
	const key = cacheKey(organizationId, userId);
	return withSingleFlight(projectScopeCache, projectScopeInflight, key, () =>
		getUserProjectScope(userId, organizationId),
	);
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
	return withSingleFlight(projectRowCache, projectRowInflight, key, () =>
		db.project.findFirst({
			where: { id: projectId, organizationId },
			select: { id: true, name: true, slug: true, organizationId: true },
		}),
	);
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
		membershipInflight.delete(key);
		permissionsInflight.delete(key);
		projectScopeInflight.delete(key);
		roleTypeInflight.delete(key);
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
