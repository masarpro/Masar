import { db } from "../client";
import { Prisma } from "../generated/client";
import {
	type Permissions,
	createEmptyPermissions,
	DEFAULT_ROLE_PERMISSIONS,
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
			members: {
				where: { organizationId },
				select: {
					role: true,
				},
				take: 1,
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
		memberRole: user.members[0]?.role ?? null,
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

	// Start with role permissions
	let basePermissions: Permissions = createEmptyPermissions();

	if (user.role?.permissions) {
		basePermissions = user.role.permissions as unknown as Permissions;
	} else if (user.memberRole) {
		// Fallback to member role
		const role = user.memberRole.toUpperCase();
		if (role === "OWNER" || role === "ADMIN") {
			basePermissions = DEFAULT_ROLE_PERMISSIONS.OWNER;
		} else if (role in DEFAULT_ROLE_PERMISSIONS) {
			basePermissions = DEFAULT_ROLE_PERMISSIONS[role];
		}
	}

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
		memberRole: member.role,
		organizationRole: member.user.organizationRole,
		hasCustomPermissions: !!member.user.customPermissions,
	}));
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
