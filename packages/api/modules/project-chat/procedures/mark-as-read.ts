import { markChannelAsRead } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const MessageChannelEnum = z.enum(["TEAM", "OWNER"]);

export const markAsReadProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/chat/mark-read",
		tags: ["Project Chat"],
		summary: "Mark a channel as read",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			channel: MessageChannelEnum,
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		await markChannelAsRead(
			input.organizationId,
			input.projectId,
			context.user.id,
			input.channel,
		);

		return { success: true };
	});
