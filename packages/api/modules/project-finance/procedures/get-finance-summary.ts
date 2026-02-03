import { getProjectFinanceSummary } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getFinanceSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/summary",
		tags: ["Project Finance"],
		summary: "Get project finance summary",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to view finance
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const summary = await getProjectFinanceSummary(
			input.organizationId,
			input.projectId,
		);

		return summary;
	});
