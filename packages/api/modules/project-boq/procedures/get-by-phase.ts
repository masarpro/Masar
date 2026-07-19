import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { canViewBoqPrices } from "../lib/price-visibility";

function convertDecimalFields(item: any, showPrices: boolean) {
	return {
		...item,
		quantity: Number(item.quantity),
		unitPrice:
			showPrices && item.unitPrice != null ? Number(item.unitPrice) : null,
		totalPrice:
			showPrices && item.totalPrice != null ? Number(item.totalPrice) : null,
	};
}

export const getByPhase = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/by-phase",
		tags: ["Project BOQ"],
		summary: "Get BOQ items grouped by project phase",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);
		const showPrices = canViewBoqPrices(permissions);

		// Get project milestones
		const milestones = await db.projectMilestone.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "asc" },
			select: { id: true, title: true, status: true },
		});

		// Get all BOQ items for this project
		const allItems = await db.projectBOQItem.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
			orderBy: { sortOrder: "asc" },
		});

		// Group items by phase
		const phases = milestones.map((milestone) => {
			const phaseItems = allItems
				.filter((item) => item.projectPhaseId === milestone.id)
				.map((item) => convertDecimalFields(item, showPrices));
			const total = phaseItems.reduce(
				(sum, item) => sum + (item.totalPrice ?? 0),
				0,
			);
			return {
				milestone,
				items: phaseItems,
				total,
				count: phaseItems.length,
			};
		});

		// Unassigned items (no phase)
		const unassignedItems = allItems
			.filter((item) => item.projectPhaseId === null)
			.map((item) => convertDecimalFields(item, showPrices));
		const unassignedTotal = unassignedItems.reduce(
			(sum, item) => sum + (item.totalPrice ?? 0),
			0,
		);

		return {
			phases,
			unassigned: {
				items: unassignedItems,
				total: unassignedTotal,
				count: unassignedItems.length,
			},
		};
	});
