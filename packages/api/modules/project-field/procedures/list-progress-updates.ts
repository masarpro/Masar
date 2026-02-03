import { getProjectProgressUpdates } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listProgressUpdatesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-field/progress-updates",
		tags: ["Project Field"],
		summary: "List progress updates for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			limit: z.number().optional().default(50),
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

		const result = await getProjectProgressUpdates(input.projectId, {
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});
