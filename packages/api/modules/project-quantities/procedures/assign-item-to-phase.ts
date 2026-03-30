import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const itemTypeEnum = z.enum(["structural", "finishing", "mep", "labor"]);

export const assignItemToPhase = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/quantities/assign-phase",
		tags: ["Project Quantities"],
		summary: "Assign a quantity item to a project phase",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			itemId: z.string().trim().max(100),
			itemType: itemTypeEnum,
			phaseId: z.string().trim().max(100).nullable(),
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

		// Verify item belongs to a study linked to this project
		const modelMap = {
			structural: db.structuralItem,
			finishing: db.finishingItem,
			mep: db.mEPItem,
			labor: db.laborItem,
		} as const;

		const model = modelMap[input.itemType];
		const item = await (model as any).findFirst({
			where: {
				id: input.itemId,
				costStudy: {
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
			},
		});

		if (!item) {
			throw new ORPCError("NOT_FOUND", {
				message: "البند غير موجود أو لا ينتمي لدراسة مرتبطة بهذا المشروع",
			});
		}

		const updated = await (model as any).update({
			where: { id: input.itemId },
			data: { projectPhaseId: input.phaseId },
		});

		return {
			id: updated.id,
			projectPhaseId: updated.projectPhaseId,
			totalCost: Number(updated.totalCost),
		};
	});
