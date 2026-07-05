import {
	NOTIFICATION_MODULES,
	getEventTypesForModule,
	listNotifications,
	type NotificationModuleKey,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const moduleKeys = NOTIFICATION_MODULES.map((m) => m.key) as [
	NotificationModuleKey,
	...NotificationModuleKey[],
];

export const listNotificationsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications",
		tags: ["Notifications"],
		summary: "List notifications for the current user",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			unreadOnly: z.boolean().optional().default(false),
			/** فلترة بمجموعة وحدة من سجل الإشعارات */
			module: z.enum(moduleKeys).optional(),
			page: z.number().int().positive().max(1000).optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		// التفويض يتم لحظة إنشاء الإشعار (فلترة الكتابة) — لا فلترة عند القراءة
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const result = await listNotifications(
			input.organizationId,
			context.user.id,
			{
				unreadOnly: input.unreadOnly,
				page: input.page,
				pageSize: input.pageSize,
				// يشمل مفاتيح السجل + الأنواع القديمة المكافئة
				types: input.module
					? getEventTypesForModule(input.module)
					: undefined,
			},
		);

		return result;
	});
