import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { protectedProcedure } from "../../../../orpc/procedures";

export const getStats = protectedProcedure
	.route({
		method: "GET",
		path: "/pricing/leads/stats",
		tags: ["Leads"],
		summary: "Get leads statistics",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "leads" },
		);

		const { organizationId } = input;

		const [total, byStatusRaw, totalEstimatedValue, recentCount] = await Promise.all([
			db.lead.count({ where: { organizationId } }),

			db.lead.groupBy({
				by: ["status"],
				where: { organizationId },
				_count: true,
			}),

			db.lead.aggregate({
				where: {
					organizationId,
					status: { notIn: ["WON", "LOST"] },
				},
				_sum: { estimatedValue: true },
			}),

			db.lead.count({
				where: {
					organizationId,
					createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
				},
			}),
		]);

		const byStatus: Record<string, number> = {
			NEW: 0,
			STUDYING: 0,
			QUOTED: 0,
			NEGOTIATING: 0,
			WON: 0,
			LOST: 0,
		};
		for (const row of byStatusRaw) {
			byStatus[row.status] = row._count;
		}

		return {
			total,
			byStatus,
			openEstimatedValue: totalEstimatedValue._sum.estimatedValue
				? Number(totalEstimatedValue._sum.estimatedValue)
				: 0,
			recentCount,
		};
	});
