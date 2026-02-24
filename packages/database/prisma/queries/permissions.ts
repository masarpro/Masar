import { db } from "../client";
import { Prisma } from "../generated/client";
import {
	type Permissions,
	createEmptyPermissions,
} from "../permissions";

/**
 * Get user with their permission context (role + custom permissions)
 */
export async function getUserWithPermissions(
	userId: string,
	organizationId: string,
) {
	const user = await db.user.findUnique({
		where: { id: userId },
		include: {
			organizationRole: {
				select: {
					id: true,
					name: true,
					type: true,
					permissions: true,
				},
			},
		},
	});

	if (!user) {
		return null;
	}

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.organizationRole,
		customPermissions: user.customPermissions as unknown as Permissions | null,
	};
}

/**
 * Get effective permissions for a user (combines role + custom)
 */
export async function getEffectivePermissions(
	userId: string,
	organizationId: string,
): Promise<Permissions> {
	const user = await getUserWithPermissions(userId, organizationId);

	if (!user) {
		return createEmptyPermissions();
	}

	// Start with role permissions (sole source of truth)
	let basePermissions: Permissions = createEmptyPermissions();

	if (user.role?.permissions) {
		basePermissions = user.role.permissions as unknown as Permissions;
	}
	// No legacy Member.role fallback — organizationRoleId is the sole source of truth

	// Merge with custom permissions if any
	if (user.customPermissions) {
		return mergePermissions(basePermissions, user.customPermissions);
	}

	return basePermissions;
}

/**
 * Update user's custom permissions
 */
export async function updateUserCustomPermissions(
	userId: string,
	permissions: Partial<Permissions>,
) {
	return db.user.update({
		where: { id: userId },
		data: {
			customPermissions: permissions as any,
		},
	});
}

/**
 * Clear user's custom permissions (revert to role defaults)
 */
export async function clearUserCustomPermissions(userId: string) {
	return db.user.update({
		where: { id: userId },
		data: {
			customPermissions: Prisma.DbNull,
		},
	});
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: string) {
	return db.user.update({
		where: { id: userId },
		data: {
			organizationRoleId: roleId,
		},
	});
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: string) {
	return db.user.update({
		where: { id: userId },
		data: {
			organizationRoleId: null,
		},
	});
}

/**
 * Get all users in an organization with their roles and permissions summary
 */
export async function getOrganizationUsersWithPermissions(
	organizationId: string,
) {
	const members = await db.member.findMany({
		where: { organizationId },
		include: {
			user: {
				include: {
					organizationRole: {
						select: {
							id: true,
							name: true,
							type: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "asc" },
	});

	return members.map((member) => ({
		id: member.user.id,
		name: member.user.name,
		email: member.user.email,
		organizationRole: member.user.organizationRole,
		hasCustomPermissions: !!member.user.customPermissions,
	}));
}

/**
 * Get user IDs of organization admins (OWNER + PROJECT_MANAGER roles)
 * Replaces the old pattern of querying Member.role for "owner"/"admin"
 */
export async function getOrganizationAdminUserIds(
	organizationId: string,
): Promise<string[]> {
	const users = await db.user.findMany({
		where: {
			organizationId,
			organizationRole: {
				type: { in: ["OWNER", "PROJECT_MANAGER"] },
			},
		},
		select: { id: true },
	});
	return users.map((u) => u.id);
}

// Helper function to merge permissions
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
