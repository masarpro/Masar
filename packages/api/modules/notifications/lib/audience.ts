/**
 * حل جمهور الإشعارات — من "مواصفة جمهور" في السجل إلى قائمة userIds.
 *
 * القاعدة الذهبية: OWNER يمر دائماً من بوابة الصلاحية (نقطة الاستثناء
 * الوحيدة في النظام) — دور بصلاحيات JSON ناقصة لا يجب أن يُعتِم على
 * صاحب المنشأة أبداً.
 */
import { db, getOrganizationAdminUserIds } from "@repo/database";
import {
	hasPermission,
	type Permissions,
} from "@repo/database/prisma/permissions";
import type { ProjectRole } from "@repo/database/prisma/generated/client";
import { getCachedUserPermissions } from "../../../lib/permissions";

/**
 * كل أعضاء المنظمة النشطين الحاملين للصلاحية المطلوبة.
 * OWNER يُضمَّن دائماً بصرف النظر عن JSON الصلاحيات المخزّن.
 * (المنظمات صغيرة 5–50 مستخدماً، وكاش الـ30 ثانية يمتص التكرار.)
 */
export async function getMembersWithPermission(
	organizationId: string,
	section: keyof Permissions,
	action: string,
): Promise<string[]> {
	const users = await db.user.findMany({
		where: { organizationId, isActive: true },
		select: {
			id: true,
			organizationRole: { select: { type: true, organizationId: true } },
		},
	});

	const checks = await Promise.all(
		users.map(async (user) => {
			if (
				user.organizationRole?.type === "OWNER" &&
				user.organizationRole.organizationId === organizationId
			) {
				return user.id;
			}
			const permissions = await getCachedUserPermissions(
				user.id,
				organizationId,
			);
			return hasPermission(permissions, section, action) ? user.id : null;
		}),
	);

	return checks.filter((id): id is string => id !== null);
}

/**
 * أعضاء فريق المشروع بالأدوار المحددة (ProjectMember)
 */
export async function getProjectMembersByRole(
	projectId: string,
	roles: ProjectRole[],
): Promise<string[]> {
	const members = await db.projectMember.findMany({
		where: {
			projectId,
			role: { in: roles },
		},
		select: { userId: true },
	});
	return members.map((m) => m.userId);
}

/** مدراء المشروع (دور MANAGER في فريق المشروع) */
export async function getProjectManagers(projectId: string): Promise<string[]> {
	return getProjectMembersByRole(projectId, ["MANAGER"]);
}

/** محاسبو المشروع (دور ACCOUNTANT في فريق المشروع) */
export async function getProjectAccountants(
	projectId: string,
): Promise<string[]> {
	return getProjectMembersByRole(projectId, ["ACCOUNTANT"]);
}

/**
 * الأدوار الإدارية في المنظمة (OWNER + PROJECT_MANAGER)
 * عبر نظام RBAC الجديد (Role model) وليس Member.role المجمّد
 */
export async function getOrganizationAdmins(
	organizationId: string,
): Promise<string[]> {
	return getOrganizationAdminUserIds(organizationId);
}
