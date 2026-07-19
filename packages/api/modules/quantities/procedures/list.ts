import { getOrganizationCostStudies } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { hasCostingReadAccess, stripStudyMoney } from "../lib/pricing-access";

export const list = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities",
		tags: ["Quantities"],
		summary: "List cost studies",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			status: z.string().trim().max(100).optional(),
			query: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			limit: z.number().int().min(1).max(500).optional().default(50),
			offset: z.number().int().nonnegative().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);
		const showMoney = hasCostingReadAccess(permissions);

		const result = await getOrganizationCostStudies(input.organizationId, {
			status: input.status,
			query: input.query,
			projectId: input.projectId,
			limit: input.limit,
			offset: input.offset,
		});

		// Convert Decimal to number for JSON serialization.
		// التكاليف والإجماليات تُحجب لمن لا يملك صلاحية تسعير فعلية.
		return {
			costStudies: result.costStudies.map((study) =>
				stripStudyMoney(convertStudyDecimals(study), showMoney),
			),
			total: result.total,
			stats: showMoney
				? result.stats
				: { ...result.stats, totalValue: 0 },
		};
	});
