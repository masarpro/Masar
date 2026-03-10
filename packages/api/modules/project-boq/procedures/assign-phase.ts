import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const assignPhase = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/assign-phase",
		tags: ["Project BOQ"],
		summary: "Assign a phase to one or more BOQ items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			itemIds: z.array(z.string()).min(1).max(100),
			phaseId: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		// Verify phase belongs to this project
		if (input.phaseId !== null) {
			const milestone = await db.projectMilestone.findFirst({
				where: {
					id: input.phaseId,
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
			});
			if (!milestone) {
				throw new ORPCError("NOT_FOUND", {
					message: "المرحلة غير موجودة أو لا تنتمي لهذا المشروع",
				});
			}
		}

		const result = await db.projectBOQItem.updateMany({
			where: {
				id: { in: input.itemIds },
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			data: { projectPhaseId: input.phaseId },
		});

		return { updatedCount: result.count };
	});
