import { getSubcontractContracts } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listSubcontracts = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts",
		tags: ["Subcontracts"],
		summary: "List subcontract contracts for a project",
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

		return getSubcontractContracts(input.organizationId, input.projectId);
	});
