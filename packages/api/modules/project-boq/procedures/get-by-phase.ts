import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

function convertDecimalFields(item: any) {
	return {
		...item,
		quantity: Number(item.quantity),
		unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
		totalPrice: item.totalPrice != null ? Number(item.totalPrice) : null,
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
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

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
				.map(convertDecimalFields);
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
			.map(convertDecimalFields);
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
