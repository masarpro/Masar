import { getUnreadChatCount } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getUnreadCountProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/chat/unread-count",
		tags: ["Project Chat"],
		summary: "Get unread chat message count",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const count = await getUnreadChatCount(
			input.organizationId,
			input.projectId,
			context.user.id,
		);

		return { count };
	});
