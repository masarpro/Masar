import { db } from "../client";

// جلب موظفي المنظمة
export async function getOrganizationUsers(organizationId: string) {
	return await db.user.findMany({
		where: {
			organizationId,
			accountType: { in: ["OWNER", "EMPLOYEE"] },
		},
		include: {
			organizationRole: true,
			createdBy: { select: { id: true, name: true } },
		},
		orderBy: [{ accountType: "asc" }, { createdAt: "asc" }],
	});
}

// جلب مستخدم بالـ ID
export async function getOrgUserById(id: string, organizationId: string) {
	return await db.user.findFirst({
		where: { id, organizationId },
		include: { organizationRole: true },
	});
}

// إنشاء موظف جديد
export async function createOrgUser(data: {
	name: string;
	email: string;
	organizationRoleId: string;
	organizationId: string;
	createdById: string;
	mustChangePassword?: boolean;
}) {
	return await db.user.create({
		data: {
			name: data.name,
			email: data.email,
			accountType: "EMPLOYEE",
			isActive: true,
			mustChangePassword: data.mustChangePassword ?? true,
			emailVerified: true,
			organizationId: data.organizationId,
			organizationRoleId: data.organizationRoleId,
			createdById: data.createdById,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		include: { organizationRole: true },
	});
}

// تحديث موظف
export async function updateOrgUser(
	id: string,
	organizationId: string,
	data: {
		name?: string;
		organizationRoleId?: string;
		isActive?: boolean;
		customPermissions?: Record<string, unknown>;
	},
) {
	// التحقق من أن المستخدم ينتمي للمنظمة
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");

	// لا يمكن تعديل المالك
	if (user.accountType === "OWNER") {
		throw new Error("لا يمكن تعديل حساب المالك");
	}

	return await db.user.update({
		where: { id },
		data: {
			name: data.name,
			organizationRoleId: data.organizationRoleId,
			isActive: data.isActive,
			customPermissions: data.customPermissions
				? (data.customPermissions as any)
				: undefined,
		},
		include: { organizationRole: true },
	});
}

// تعطيل/تفعيل موظف
export async function toggleUserActive(id: string, organizationId: string) {
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");
	if (user.accountType === "OWNER")
		throw new Error("لا يمكن تعطيل حساب المالك");

	return await db.user.update({
		where: { id },
		data: { isActive: !user.isActive },
	});
}

// حذف موظف
export async function deleteOrgUser(id: string, organizationId: string) {
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");
	if (user.accountType === "OWNER")
		throw new Error("لا يمكن حذف حساب المالك");

	return await db.user.delete({ where: { id } });
}
