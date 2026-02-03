import { listMessages } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const MessageChannelEnum = z.enum(["TEAM", "OWNER"]);

export const listMessagesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/chat/{channel}",
		tags: ["Project Chat"],
		summary: "List messages in a project channel",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			channel: MessageChannelEnum,
			page: z.number().int().positive().optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(50),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await listMessages(
			input.organizationId,
			input.projectId,
			input.channel,
			{
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
	});
