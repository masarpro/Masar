import { listActivities } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listActivitiesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/activities",
		tags: ["Project Execution"],
		summary: "List activities",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const activities = await listActivities(
			input.organizationId,
			input.projectId,
			input.milestoneId,
		);

		return { activities };
	});
