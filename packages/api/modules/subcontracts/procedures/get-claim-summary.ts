import { getSubcontractClaimSummary } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getSubcontractClaimSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/{contractId}/claims/summary",
		tags: ["Subcontract Claims"],
		summary: "Get financial summary for a subcontract",
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

		try {
			return await getSubcontractClaimSummary(
				input.contractId,
				input.organizationId,
			);
		} catch (error) {
			if (error instanceof Error && error.message === "CONTRACT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "عقد الباطن غير موجود" });
			}
			throw error;
		}
	});
