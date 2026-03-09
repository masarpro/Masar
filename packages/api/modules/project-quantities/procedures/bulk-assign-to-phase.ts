import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const itemTypeEnum = z.enum(["structural", "finishing", "mep", "labor"]);

export const bulkAssignToPhase = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/quantities/bulk-assign-phase",
		tags: ["Project Quantities"],
		summary: "Bulk assign quantity items to a project phase",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			items: z.array(
				z.object({
					itemId: z.string(),
					itemType: itemTypeEnum,
				}),
			),
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

		// Verify phase belongs to this project (if phaseId is not null)
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

		// Group items by type for batch updates
		const grouped: Record<string, string[]> = {
			structural: [],
			finishing: [],
			mep: [],
			labor: [],
		};
		for (const item of input.items) {
			grouped[item.itemType].push(item.itemId);
		}

		const projectStudyFilter = {
			costStudy: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		};

		const operations = [];

		if (grouped.structural.length > 0) {
			operations.push(
				db.structuralItem.updateMany({
					where: {
						id: { in: grouped.structural },
						...projectStudyFilter,
					},
					data: { projectPhaseId: input.phaseId },
				}),
			);
		}
		if (grouped.finishing.length > 0) {
			operations.push(
				db.finishingItem.updateMany({
					where: {
						id: { in: grouped.finishing },
						...projectStudyFilter,
					},
					data: { projectPhaseId: input.phaseId },
				}),
			);
		}
		if (grouped.mep.length > 0) {
			operations.push(
				db.mEPItem.updateMany({
					where: {
						id: { in: grouped.mep },
						...projectStudyFilter,
					},
					data: { projectPhaseId: input.phaseId },
				}),
			);
		}
		if (grouped.labor.length > 0) {
			operations.push(
				db.laborItem.updateMany({
					where: {
						id: { in: grouped.labor },
						...projectStudyFilter,
					},
					data: { projectPhaseId: input.phaseId },
				}),
			);
		}

		const results = await db.$transaction(operations);
		const updatedCount = results.reduce((sum, r) => sum + r.count, 0);

		return { updatedCount };
	});
