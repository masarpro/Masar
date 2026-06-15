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

export const getBoqGroupedByPhase = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/grouped-by-phase",
		tags: ["Project BOQ"],
		summary:
			"Get BOQ items grouped by execution milestone (incl empty milestones)",
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

		const [milestones, allItems] = await Promise.all([
			db.projectMilestone.findMany({
				where: {
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
				orderBy: { orderIndex: "asc" },
				include: {
					_count: { select: { activities: true } },
				},
			}),
			db.projectBOQItem.findMany({
				where: {
					projectId: input.projectId,
					organizationId: input.organizationId,
				},
				orderBy: { sortOrder: "asc" },
			}),
		]);

		const phases = milestones.map((m) => {
			const items = allItems
				.filter((it) => it.projectPhaseId === m.id)
				.map(convertDecimalFields);
			let total = 0;
			let pricedCount = 0;
			let unpricedCount = 0;
			for (const it of items) {
				if (it.totalPrice != null) {
					total += it.totalPrice;
					pricedCount++;
				} else {
					unpricedCount++;
				}
			}
			return {
				milestone: {
					id: m.id,
					title: m.title,
					description: m.description,
					status: m.status,
					orderIndex: m.orderIndex,
					plannedStart: m.plannedStart,
					plannedEnd: m.plannedEnd,
					activitiesCount: m._count.activities,
				},
				items,
				total,
				pricedCount,
				unpricedCount,
				count: items.length,
			};
		});

		const unassignedItems = allItems
			.filter((it) => it.projectPhaseId === null)
			.map(convertDecimalFields);
		let unassignedTotal = 0;
		let unassignedPriced = 0;
		let unassignedUnpriced = 0;
		for (const it of unassignedItems) {
			if (it.totalPrice != null) {
				unassignedTotal += it.totalPrice;
				unassignedPriced++;
			} else {
				unassignedUnpriced++;
			}
		}

		const grandTotal =
			phases.reduce((s, p) => s + p.total, 0) + unassignedTotal;

		return {
			phases,
			unassigned: {
				items: unassignedItems,
				total: unassignedTotal,
				pricedCount: unassignedPriced,
				unpricedCount: unassignedUnpriced,
				count: unassignedItems.length,
			},
			grandTotal,
		};
	});
