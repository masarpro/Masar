import { listMilestones } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listMilestonesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-timeline/milestones",
		tags: ["Project Timeline"],
		summary: "List milestones for a project",
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

		const milestones = await listMilestones(
			input.organizationId,
			input.projectId,
		);

		return { milestones };
	});
