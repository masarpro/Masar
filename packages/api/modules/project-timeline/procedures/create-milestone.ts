import { createMilestone } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const createMilestoneProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-timeline/milestones",
		tags: ["Project Timeline"],
		summary: "Create a new milestone",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			title: z.string().min(1).max(200),
			description: z.string().max(2000).optional(),
			orderIndex: z.number().int().min(0).optional(),
			plannedStart: z.string().datetime().optional(),
			plannedEnd: z.string().datetime().optional(),
			isCritical: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const milestone = await createMilestone(
			input.organizationId,
			input.projectId,
			{
				title: input.title,
				description: input.description,
				orderIndex: input.orderIndex,
				plannedStart: input.plannedStart
					? new Date(input.plannedStart)
					: undefined,
				plannedEnd: input.plannedEnd ? new Date(input.plannedEnd) : undefined,
				isCritical: input.isCritical,
			},
		);

		return { milestone };
	});
