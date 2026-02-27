import { reorderActivities } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const reorderActivitiesProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/activities/reorder",
		tags: ["Project Execution"],
		summary: "Reorder activities within a milestone",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string(),
			activityIds: z.array(z.string()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const activities = await reorderActivities(
			input.organizationId,
			input.projectId,
			input.milestoneId,
			input.activityIds,
		);

		return { activities };
	});
