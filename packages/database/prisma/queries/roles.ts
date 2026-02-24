import { db } from "../client";
import type { RoleType } from "../generated/client";
import {
	DEFAULT_ROLE_PERMISSIONS,
	ROLE_NAMES_AR,
	type Permissions,
} from "../permissions";

// جلب أدوار المنظمة
export async function getOrganizationRoles(organizationId: string) {
	return await db.role.findMany({
		where: { organizationId },
		include: {
			_count: { select: { users: true } },
		},
		orderBy: { createdAt: "asc" },
	});
}

// جلب دور بالـ ID
export async function getRoleById(id: string) {
	return await db.role.findUnique({
		where: { id },
		include: { users: true },
	});
}

// إنشاء دور جديد
export async function createRole(data: {
	name: string;
	nameEn?: string;
	description?: string;
	type: RoleType;
	permissions: Permissions;
	organizationId: string;
	isSystem?: boolean;
}) {
	return await db.role.create({
		data: {
			name: data.name,
			nameEn: data.nameEn,
			description: data.description,
			type: data.type,
			permissions: data.permissions as any,
			organizationId: data.organizationId,
			isSystem: data.isSystem ?? false,
		},
	});
}

// الأدوار الافتراضية
const DEFAULT_ROLES: Array<{ type: RoleType; isSystem: boolean }> = [
	{ type: "OWNER", isSystem: true },
	{ type: "PROJECT_MANAGER", isSystem: true },
	{ type: "ACCOUNTANT", isSystem: true },
	{ type: "ENGINEER", isSystem: true },
	{ type: "SUPERVISOR", isSystem: true },
];

// إنشاء الأدوار الافتراضية لمنظمة جديدة
export async function createDefaultRoles(organizationId: string) {
	return createDefaultRolesInTx(db, organizationId);
}

// إنشاء الأدوار الافتراضية داخل transaction
export async function createDefaultRolesInTx(
	tx: Parameters<Parameters<typeof db.$transaction>[0]>[0] | typeof db,
	organizationId: string,
) {
	const createdRoles = [];

	for (const role of DEFAULT_ROLES) {
		// Skip if this role type already exists for this org
		const existing = await tx.role.findFirst({
			where: { organizationId, type: role.type },
		});
		if (existing) {
			createdRoles.push(existing);
			continue;
		}

		const created = await tx.role.create({
			data: {
				name: ROLE_NAMES_AR[role.type] ?? role.type,
				nameEn: role.type.replace(/_/g, " ").toLowerCase(),
				type: role.type,
				isSystem: role.isSystem,
				permissions: DEFAULT_ROLE_PERMISSIONS[role.type] as any,
				organizationId,
			},
		});
		createdRoles.push(created);
	}

	return createdRoles;
}

// تحديث دور
export async function updateRole(
	id: string,
	data: {
		name?: string;
		nameEn?: string;
		description?: string;
		permissions?: Permissions;
	},
) {
	return await db.role.update({
		where: { id },
		data: {
			...data,
			permissions: data.permissions
				? (data.permissions as any)
				: undefined,
		},
	});
}

// حذف دور (فقط إذا لم يكن system)
export async function deleteRole(id: string) {
	const role = await db.role.findUnique({ where: { id } });
	if (role?.isSystem) {
		throw new Error("لا يمكن حذف دور النظام");
	}
	return await db.role.delete({ where: { id } });
}
