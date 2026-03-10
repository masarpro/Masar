import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/summary",
		tags: ["Project BOQ"],
		summary: "Get BOQ summary for a project",
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
			{ section: "quantities", action: "view" },
		);

		const baseWhere = {
			projectId: input.projectId,
			organizationId: input.organizationId,
		};

		const [totalCount, pricedCount, sectionTotals, sourceTotals, grandTotal] =
			await Promise.all([
				db.projectBOQItem.count({ where: baseWhere }),
				db.projectBOQItem.count({
					where: { ...baseWhere, unitPrice: { not: null } },
				}),
				db.projectBOQItem.groupBy({
					by: ["section"],
					where: { ...baseWhere, unitPrice: { not: null } },
					_sum: { totalPrice: true },
					_count: true,
				}),
				db.projectBOQItem.groupBy({
					by: ["sourceType"],
					where: baseWhere,
					_count: true,
				}),
				db.projectBOQItem.aggregate({
					where: { ...baseWhere, unitPrice: { not: null } },
					_sum: { totalPrice: true },
				}),
			]);

		const sectionMap: Record<string, { count: number; total: number }> = {
			STRUCTURAL: { count: 0, total: 0 },
			FINISHING: { count: 0, total: 0 },
			MEP: { count: 0, total: 0 },
			LABOR: { count: 0, total: 0 },
			GENERAL: { count: 0, total: 0 },
		};
		for (const s of sectionTotals) {
			sectionMap[s.section] = {
				count: s._count,
				total: Number(s._sum.totalPrice ?? 0),
			};
		}

		const sourceMap: Record<string, number> = {
			MANUAL: 0,
			COST_STUDY: 0,
			IMPORTED: 0,
			CONTRACT: 0,
			QUOTATION: 0,
		};
		for (const s of sourceTotals) {
			sourceMap[s.sourceType] = s._count;
		}

		return {
			totalItems: totalCount,
			pricedItems: pricedCount,
			unpricedItems: totalCount - pricedCount,
			sections: sectionMap,
			sources: sourceMap,
			grandTotal: Number(grandTotal._sum.totalPrice ?? 0),
		};
	});
