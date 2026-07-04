/**
 * RBAC filtering for notifications (Stage 5 — RBAC-UI).
 *
 * Central map: NotificationType → required permission. A recipient without
 * the permission never receives the notification (filter at creation), and
 * a reader without it never sees stored ones (filter at fetch — defense in
 * depth for notifications created before this change).
 *
 * `null` = general/personal notification, delivered to everyone targeted
 * (e.g. decisions sent back to the requester, team add/remove, SYSTEM).
 */
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

	const checks = await Promise.all(
		userIds.map(async (userId) => {
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
 * Notification types the given permissions may NOT see — used as a
 * defensive read-time filter (covers notifications stored before RBAC
 * filtering existed).
 */
export function getExcludedNotificationTypes(
	permissions: Permissions,
): NotificationType[] {
	return (
		Object.entries(NOTIFICATION_TYPE_PERMISSIONS) as [
			NotificationType,
			RequiredNotificationPermission | null,
		][]
	)
		.filter(
			([, required]) =>
				required &&
				!hasPermission(permissions, required.section, required.action),
		)
		.map(([type]) => type);
}
