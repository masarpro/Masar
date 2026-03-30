import { getSubcontractClaims } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const listSubcontractClaimsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/claims",
		tags: ["Subcontract Claims"],
		summary: "List subcontract claims",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: z.string().trim().max(100).optional(),
			status: z
				.enum([
					"DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED",
					"PARTIALLY_PAID", "PAID", "REJECTED", "CANCELLED",
				])
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		return getSubcontractClaims(input.organizationId, {
			contractId: input.contractId,
			projectId: input.projectId,
			status: input.status as any,
		});
	});
