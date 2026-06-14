import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getExecutionMilestones = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/execution-milestones",
		tags: ["Project BOQ"],
		summary:
			"List execution milestones with activity counts for copy-to-BOQ dialog",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const milestones = await db.projectMilestone.findMany({
			where: {
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			orderBy: { orderIndex: "asc" },
			include: {
				_count: { select: { activities: true } },
			},
		});

		return milestones.map((m) => ({
			id: m.id,
			title: m.title,
			description: m.description,
			orderIndex: m.orderIndex,
			status: m.status,
			plannedStart: m.plannedStart,
			plannedEnd: m.plannedEnd,
			activitiesCount: m._count.activities,
		}));
	});
