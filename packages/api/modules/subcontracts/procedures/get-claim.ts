import { getSubcontractClaimById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getSubcontractClaimProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}",
		tags: ["Subcontract Claims"],
		summary: "Get subcontract claim details",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			claimId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const claim = await getSubcontractClaimById(
			input.claimId,
			input.organizationId,
		);

		if (!claim) {
			throw new ORPCError("NOT_FOUND", {
				message: "المستخلص غير موجود",
			});
		}

		return claim;
	});
