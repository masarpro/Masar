"use client";

/**
 * مجموعات الإشعارات المرئية للمستخدم الحالي — تقاطع سجل الإشعارات مع صلاحياته.
 * الحدث مرئي إذا: لا بوابة صلاحية عليه، أو المستخدم OWNER، أو يحمل الصلاحية.
 * المجموعات الفارغة تُستبعد.
 */
import {
	NOTIFICATION_MODULES,
	NOTIFICATION_REGISTRY,
	type NotificationEventDef,
	type NotificationModuleKey,
} from "@repo/database/prisma/notification-registry";
import { usePermission } from "@saas/permissions/hooks/use-permission";
import { useMemo } from "react";

export interface VisibleNotificationGroup {
	key: NotificationModuleKey;
	events: NotificationEventDef[];
}

export interface UseVisibleNotificationGroupsResult {
	isLoading: boolean;
	groups: VisibleNotificationGroup[];
}

export function useVisibleNotificationGroups(): UseVisibleNotificationGroupsResult {
	const { can, isOwner, isLoading } = usePermission();

	const groups = useMemo(() => {
		return NOTIFICATION_MODULES.map((module) => ({
			key: module.key,
			events: NOTIFICATION_REGISTRY.filter(
				(event) =>
					event.module === module.key &&
					(event.permission === null ||
						isOwner ||
						can(event.permission.section, event.permission.action)),
			),
		})).filter((group) => group.events.length > 0);
	}, [can, isOwner]);

	return { isLoading, groups };
}
