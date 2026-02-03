import { listNotifications } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listNotificationsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications",
		tags: ["Notifications"],
		summary: "List notifications for the current user",
	})
	.input(
		z.object({
			organizationId: z.string(),
			unreadOnly: z.boolean().optional().default(false),
			page: z.number().int().positive().optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		const result = await listNotifications(
			input.organizationId,
			context.user.id,
			{
				unreadOnly: input.unreadOnly,
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
	});
