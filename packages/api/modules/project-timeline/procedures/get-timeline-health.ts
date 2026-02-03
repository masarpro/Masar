import { getTimelineHealth } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getTimelineHealthProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-timeline/health",
		tags: ["Project Timeline"],
		summary: "Get timeline health summary for a project",
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

		const health = await getTimelineHealth(
			input.organizationId,
			input.projectId,
		);

		return { health };
	});
