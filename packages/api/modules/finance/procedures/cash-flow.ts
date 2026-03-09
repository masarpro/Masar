import { getCashFlowReport } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const getCashFlowReportProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/cash-flow",
		tags: ["Finance", "Reports"],
		summary: "Get cash flow report with period breakdown",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			periodType: z.enum(["weekly", "monthly"]),
			dateFrom: z.string().datetime(),
			dateTo: z.string().datetime(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		await enforceFeatureAccess(
			input.organizationId,
			"reports.detailed",
			context.user,
		);

		const report = await getCashFlowReport(input.organizationId, {
			projectId: input.projectId,
			periodType: input.periodType,
			dateFrom: new Date(input.dateFrom),
			dateTo: new Date(input.dateTo),
		});

		return report;
	});
