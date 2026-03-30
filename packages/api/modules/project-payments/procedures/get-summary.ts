import { getProjectPaymentsSummary } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getProjectPaymentsSummaryProcedure = subscriptionProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/payments/summary",
		tags: ["Project Payments"],
		summary: "Get project payments summary with contract terms",
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
			{ section: "projects", action: "viewFinance" },
		);

		return getProjectPaymentsSummary(input.organizationId, input.projectId);
	});
