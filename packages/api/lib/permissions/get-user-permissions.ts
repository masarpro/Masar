import { db } from "@repo/database";
import {
	type Permissions,
	createEmptyPermissions,
} from "@repo/database/prisma/permissions";

/**
 * Get user's effective permissions within an organization
 *
 * Priority:
 * 1. User's customPermissions (highest priority - overrides role)
 * 2. User's organizationRole permissions (sole source of truth)
 * 3. Empty permissions (no access)
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
			return user.organizationRole.permissions as unknown as Permissions;
		} catch {
			// Invalid JSON, continue to empty
		}
	}

	// No legacy Member.role fallback — organizationRoleId is the sole source of truth
	return createEmptyPermissions();
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
	_organizationId: string,
): Promise<string | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			organizationRole: true,
		},
	});

	if (!user) return null;

	// Sole source of truth: organizationRole
	return user.organizationRole?.type ?? null;
}
