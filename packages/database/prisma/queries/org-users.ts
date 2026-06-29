import { db } from "../client";

// التحقق إن كان البريد يخص مستخدماً قائماً منتمياً لمنشأة غير المنشأة الداعية.
// يُستخدم لمنع ربط بريد بأكثر من منشأة (النظام أحادي المنشأة عبر user.organizationId).
// يفحص كلا المصدرين: جدول Member (يملؤه مسار BetterAuth) و user.organizationId (كلا المسارين).
// المقارنة case-insensitive لأن البريد لا يُطبَّع lowercase عند التخزين.
export async function findMembershipInAnotherOrg(
	email: string,
	excludeOrganizationId?: string,
) {
	const normalized = email.toLowerCase().trim();
	const user = await db.user.findFirst({
		where: { email: { equals: normalized, mode: "insensitive" } },
		select: { id: true, organizationId: true },
	});
	if (!user) {
		return null; // شخص جديد → اسمح
	}

	const member = await db.member.findFirst({
		where: {
			userId: user.id,
			...(excludeOrganizationId
				? { organizationId: { not: excludeOrganizationId } }
				: {}),
		},
		select: { id: true },
	});

	const belongsElsewhere =
		!!member ||
		(!!user.organizationId &&
			user.organizationId !== excludeOrganizationId);

	return belongsElsewhere ? { userId: user.id } : null;
}

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
	isActive?: boolean;
	emailVerified?: boolean;
	allProjectsAccess?: boolean;
}) {
	// Validate role belongs to the same organization
	const role = await db.role.findUnique({
		where: { id: data.organizationRoleId },
		select: { organizationId: true },
	});
	if (!role || role.organizationId !== data.organizationId) {
		throw new Error("الدور لا ينتمي لهذه المنظمة");
	}

	return await db.user.create({
		data: {
			name: data.name,
			email: data.email,
			accountType: "EMPLOYEE",
			isActive: data.isActive ?? true,
			mustChangePassword: data.mustChangePassword ?? true,
			emailVerified: data.emailVerified ?? true,
			allProjectsAccess: data.allProjectsAccess ?? false,
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
		allProjectsAccess?: boolean;
	},
) {
	// التحقق من أن المستخدم ينتمي للمنظمة
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");

	// لا يمكن تعديل المالك
	if (user.accountType === "OWNER") {
		throw new Error("لا يمكن تعديل حساب المالك");
	}

	// Validate new role belongs to the same organization
	if (data.organizationRoleId) {
		const role = await db.role.findUnique({
			where: { id: data.organizationRoleId },
			select: { organizationId: true },
		});
		if (!role || role.organizationId !== organizationId) {
			throw new Error("الدور لا ينتمي لهذه المنظمة");
		}
	}

	// When deactivating a user (isActive: true -> false), immediately invalidate
	// all their sessions so they lose access on the very next request.
	const isBeingDeactivated = data.isActive === false && user.isActive === true;

	const updated = await db.user.update({
		where: { id },
		data: {
			name: data.name,
			organizationRoleId: data.organizationRoleId,
			isActive: data.isActive,
			allProjectsAccess: data.allProjectsAccess,
			customPermissions: data.customPermissions
				? (data.customPermissions as any)
				: undefined,
		},
		include: { organizationRole: true },
	});

	if (isBeingDeactivated) {
		await db.session.deleteMany({ where: { userId: id } });
	}

	return updated;
}

// تعطيل/تفعيل موظف
export async function toggleUserActive(id: string, organizationId: string) {
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");
	if (user.accountType === "OWNER")
		throw new Error("لا يمكن تعطيل حساب المالك");

	const newIsActive = !user.isActive;

	const updated = await db.user.update({
		where: { id },
		data: { isActive: newIsActive },
	});

	// When toggling to inactive, immediately invalidate all sessions so the
	// user loses access on the very next request — not after session expiry.
	if (!newIsActive) {
		await db.session.deleteMany({ where: { userId: id } });
	}

	return updated;
}

// حذف موظف
export async function deleteOrgUser(id: string, organizationId: string) {
	const user = await db.user.findFirst({ where: { id, organizationId } });
	if (!user) throw new Error("المستخدم غير موجود");
	if (user.accountType === "OWNER")
		throw new Error("لا يمكن حذف حساب المالك");

	return await db.user.delete({ where: { id } });
}
