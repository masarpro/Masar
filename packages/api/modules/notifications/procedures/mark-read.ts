import { ORPCError } from "@orpc/server";
import { markNotificationsRead, markAllNotificationsRead } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const markReadProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/mark-read",
		tags: ["Notifications"],
		summary: "Mark notifications as read",
	})
	.input(
		z.object({
			organizationId: z.string(),
			notificationIds: z.array(z.string()).optional(),
			markAll: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		if (input.markAll) {
			await markAllNotificationsRead(
				input.organizationId,
				context.user.id,
			);
		} else if (input.notificationIds && input.notificationIds.length > 0) {
			await markNotificationsRead(
				input.organizationId,
				context.user.id,
				input.notificationIds,
			);
		} else {
			throw new ORPCError("BAD_REQUEST", {
				message: "يجب تحديد الإشعارات أو اختيار قراءة الكل",
			});
		}

		return { success: true };
	});
