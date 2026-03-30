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
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			limit: z.number().int().min(1).max(500).optional().default(50),
			offset: z.number().int().nonnegative().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await listMilestones(
			input.organizationId,
			input.projectId,
			{ limit: input.limit, offset: input.offset },
		);

		return { milestones: result.items, total: result.total };
	});
