import { getSubcontractItems } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const listSubcontractItemsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/{contractId}/items",
		tags: ["Subcontract Items"],
		summary: "List items for a subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		return getSubcontractItems(input.contractId, input.organizationId);
	});
