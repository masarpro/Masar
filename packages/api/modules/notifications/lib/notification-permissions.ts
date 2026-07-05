/**
 * RBAC filtering for notifications.
 *
 * Central map: NotificationType → required permission. A recipient without
 * the permission never receives the notification — the filter runs once, at
 * creation time. Authorization is decided at the moment of the event; stored
 * notifications are never re-filtered on read.
 *
 * OWNER always passes: the organization owner receives every notification
 * regardless of the stored role JSON (roles created before a permission
 * section existed would otherwise silently black out the owner).
 *
 * `null` = general/personal notification, delivered to everyone targeted
 * (e.g. decisions sent back to the requester, team add/remove, SYSTEM).
 */
import { db } from "@repo/database";
import type { NotificationType } from "@repo/database/prisma/generated/client";
import {
	hasPermission,
	type Permissions,
} from "@repo/database/prisma/permissions";
import { getCachedUserPermissions } from "../../../lib/permissions";

export interface RequiredNotificationPermission {
	section: keyof Permissions;
	action: string;
}

export const NOTIFICATION_TYPE_PERMISSIONS: Record<
	NotificationType,
	RequiredNotificationPermission | null
> = {
	// اعتمادات المستندات — من يطّلع على المشاريع
	APPROVAL_REQUESTED: { section: "projects", action: "view" },
	// قرار يعود لصاحب الطلب — شخصي
	APPROVAL_DECIDED: null,
	DOCUMENT_CREATED: { section: "projects", action: "view" },
	DAILY_REPORT_CREATED: { section: "projects", action: "view" },
	ISSUE_CREATED: { section: "projects", action: "view" },
	ISSUE_CRITICAL: { section: "projects", action: "view" },
	// مالية — لا تصل لمن لا يملك عرض المالية
	EXPENSE_CREATED: { section: "finance", action: "view" },
	CLAIM_CREATED: { section: "finance", action: "view" },
	// تحديث حالة لمستخلص أنشأه المستلم — شخصي
	CLAIM_STATUS_CHANGED: null,
	CHANGE_ORDER_CREATED: { section: "projects", action: "view" },
	// قرارات تعود لمنشئ أمر التغيير — شخصية
	CHANGE_ORDER_APPROVED: null,
	CHANGE_ORDER_REJECTED: null,
	OWNER_MESSAGE: { section: "projects", action: "view" },
	// شخصية — تخص المستلم نفسه
	TEAM_MEMBER_ADDED: null,
	TEAM_MEMBER_REMOVED: null,
	SYSTEM: null,
};

/**
 * Keep only recipients holding the permission required by this
 * notification type. Uses the same cached permission source as the
 * authorization layer (cross-tenant guarded).
 */
export async function filterRecipientsByPermission(
	organizationId: string,
	userIds: string[],
	notificationType: NotificationType,
): Promise<string[]> {
	const required = NOTIFICATION_TYPE_PERMISSIONS[notificationType];
	if (!required || userIds.length === 0) {
		return userIds;
	}

	// OWNER bypass — one batch query, not per-user
	const ownerIds = await getOwnerUserIds(organizationId, userIds);

	const checks = await Promise.all(
		userIds.map(async (userId) => {
			if (ownerIds.has(userId)) {
				return userId;
			}
			const permissions = await getCachedUserPermissions(
				userId,
				organizationId,
			);
			return hasPermission(permissions, required.section, required.action)
				? userId
				: null;
		}),
	);

	return checks.filter((id): id is string => id !== null);
}

/**
 * Which of the given users hold the OWNER role type in this organization.
 * Same source of truth as authorization: User.organizationRoleId → Role.type,
 * cross-tenant guarded by matching both the user's and the role's org.
 */
export async function getOwnerUserIds(
	organizationId: string,
	userIds: string[],
): Promise<Set<string>> {
	if (userIds.length === 0) {
		return new Set();
	}
	const owners = await db.user.findMany({
		where: {
			id: { in: userIds },
			organizationId,
			organizationRole: { type: "OWNER", organizationId },
		},
		select: { id: true },
	});
	return new Set(owners.map((u) => u.id));
}
