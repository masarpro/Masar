import { getFieldTimeline } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getFieldTimelineProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-field/timeline",
		tags: ["Project Field"],
		summary: "Get field timeline for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			limit: z.number().optional().default(20),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await getFieldTimeline(input.projectId, {
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});
