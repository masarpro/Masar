import { getContractSummary } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getContractSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/contract/summary",
		tags: ["Project Contract"],
		summary: "Get contract summary with adjusted value and retention",
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
			{ section: "projects", action: "viewFinance" },
		);

		return getContractSummary(input.organizationId, input.projectId);
	});
