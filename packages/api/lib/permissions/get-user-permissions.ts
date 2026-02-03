import { db } from "@repo/database";
import {
	type Permissions,
	createEmptyPermissions,
	DEFAULT_ROLE_PERMISSIONS,
} from "@repo/database/prisma/permissions";

/**
 * Get user's effective permissions within an organization
 *
 * Priority:
 * 1. User's customPermissions (highest priority - overrides role)
 * 2. User's organizationRole permissions
 * 3. Member role fallback (owner/admin)
 * 4. Empty permissions (no access)
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
			members: {
				where: { organizationId },
				take: 1,
			},
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

	// Priority 2: Check organization role permissions
	if (user.organizationRole?.permissions) {
		try {
			return user.organizationRole.permissions as unknown as Permissions;
		} catch {
			// Invalid JSON, continue to fallback
		}
	}

	// Priority 3: Fallback to member role (legacy support)
	const membership = user.members[0];
	if (membership) {
		const role = membership.role.toUpperCase();
		if (role === "OWNER" || role === "ADMIN") {
			return DEFAULT_ROLE_PERMISSIONS.OWNER;
		}
		// Check if role matches a default role
		if (role in DEFAULT_ROLE_PERMISSIONS) {
			return DEFAULT_ROLE_PERMISSIONS[role];
		}
	}

	// Priority 4: No permissions
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
	organizationId: string,
): Promise<string | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			organizationRole: true,
			members: {
				where: { organizationId },
				take: 1,
			},
		},
	});

	if (!user) return null;

	if (user.organizationRole) {
		return user.organizationRole.type;
	}

	const membership = user.members[0];
	if (membership) {
		return membership.role.toUpperCase();
	}

	return null;
}
