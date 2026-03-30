import { getSubcontractPaymentTermsProgress } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getSubcontractPaymentTermsProgressProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/{contractId}/payment-terms-progress",
		tags: ["Subcontracts"],
		summary: "Get subcontract payment terms with progress",
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

		const result = await getSubcontractPaymentTermsProgress(
			input.contractId,
		);

		if (!result) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

		return result;
	});
