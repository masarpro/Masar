import { getProjectProfitabilityReport } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const getProjectProfitabilityProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/profitability",
		tags: ["Finance", "Reports"],
		summary: "Get project profitability report",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			dateFrom: z.string().datetime().optional(),
			dateTo: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "reports" },
		);

		await enforceFeatureAccess(
			input.organizationId,
			"reports.detailed",
			context.user,
		);

		const report = await getProjectProfitabilityReport(
			input.organizationId,
			input.projectId,
			input.dateFrom ? new Date(input.dateFrom) : undefined,
			input.dateTo ? new Date(input.dateTo) : undefined,
		);

		return report;
	});
