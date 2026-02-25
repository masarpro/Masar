import { db } from "@repo/database";
import {
	type Permissions,
	createEmptyPermissions,
	DEFAULT_ROLE_PERMISSIONS,
} from "@repo/database/prisma/permissions";

/**
 * Get user's effective permissions within an organization.
 *
 * Architecture (Sprint 1.2 decision):
 * - Single source of truth: User.organizationRoleId → Role.permissions
 * - User.organizationId = user's primary org (role only applies there)
 * - BetterAuth Member.role is FROZEN — never used for authorization
 * - Multi-org: not first-class; Sprint 1.1 org guard below prevents cross-tenant escalation
 *
 * Priority:
 * 1. User's customPermissions (highest priority - overrides role)
 * 2. User's organizationRole permissions
 * 3. Empty permissions (deny all)
 */
export async function getUserPermissions(
	userId: string,
	organizationId: string,
): Promise<Permissions> {
	// Get user with their organization role
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			organizationRole: true,
		},
	});

	if (!user) {
		return createEmptyPermissions();
	}

	// Guard: ensure the user's role belongs to the requested organization.
	// Without this, a user who is OWNER in Org X but also a Member of Org Y
	// (via Better Auth invitation) would receive Org X's OWNER permissions
	// when operating in Org Y context — a cross-tenant privilege escalation.
	if (user.organizationId !== organizationId) {
		return createEmptyPermissions();
	}

	// Priority 1: Check for custom permissions on user
	if (user.customPermissions) {
		try {
			const customPerms = user.customPermissions as unknown as Permissions;
			// Merge with role permissions if exists
			if (user.organizationRole?.permissions) {
				return mergePermissions(
					user.organizationRole.permissions as unknown as Permissions,
					customPerms,
				);
			}
			return customPerms;
		} catch {
			// Invalid JSON, continue to role permissions
		}
	}

	// Priority 2: Check organization role permissions (sole source of truth)
	if (user.organizationRole?.permissions) {
		try {
			const stored = user.organizationRole.permissions as unknown as Permissions;
			// For system roles, fill in any missing permission sections from defaults
			// This handles cases where new sections (e.g. company) were added after the role was created
			const roleType = user.organizationRole.type;
			if (roleType && DEFAULT_ROLE_PERMISSIONS[roleType]) {
				return fillMissingSections(stored, DEFAULT_ROLE_PERMISSIONS[roleType]);
			}
			return fillMissingSections(stored, createEmptyPermissions());
		} catch {
			// Invalid JSON, continue to empty
		}
	}

	// No legacy Member.role fallback — organizationRoleId is the sole source of truth
	return createEmptyPermissions();
}

/**
 * Fill in missing permission sections from defaults.
 * Only adds sections that don't exist in stored — never overrides existing values.
 * This handles schema evolution where new sections are added after role creation.
 */
function fillMissingSections(
	stored: Partial<Permissions>,
	defaults: Permissions,
): Permissions {
	const result = { ...defaults };

	for (const section of Object.keys(defaults) as (keyof Permissions)[]) {
		if (stored[section] !== undefined && stored[section] !== null) {
			// Section exists in stored — use it, but fill in any missing sub-keys
			result[section] = {
				...defaults[section],
				...stored[section],
			} as any;
		}
		// else: section missing in stored — keep the default
	}

	// Auto-populate pricing from legacy quantities + finance.quotations
	// if pricing section was not explicitly stored (backward compatibility)
	if (!stored.pricing) {
		const q = result.quantities;
		const f = result.finance;
		result.pricing = {
			view: q.view || f.view,
			studies: q.create || q.edit,
			quotations: f.quotations,
			pricing: q.pricing,
		};
	}

	return result;
}

/**
 * Merge two permission objects, with override taking precedence
 */
function mergePermissions(
	base: Permissions,
	override: Partial<Permissions>,
): Permissions {
	const merged = { ...base };

	for (const section of Object.keys(override) as (keyof Permissions)[]) {
		if (override[section]) {
			merged[section] = {
				...base[section],
				...override[section],
			} as any;
		}
	}

	return merged;
}

/**
 * Get user's organization role type (for display purposes)
 */
export async function getUserRoleType(
	userId: string,
	organizationId: string,
): Promise<string | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			organizationRole: true,
		},
	});

	if (!user) return null;

	// Same org guard as getUserPermissions — don't leak role type cross-tenant
	if (user.organizationId !== organizationId) return null;

	// Sole source of truth: organizationRole
	return user.organizationRole?.type ?? null;
}
