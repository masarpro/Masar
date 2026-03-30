import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { getCostStudyById, recalculateCostStudyTotals } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const recalculate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/recalculate",
		tags: ["Quantities"],
		summary: "Recalculate cost study totals",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.id, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await recalculateCostStudyTotals(input.id);

		return { success: true };
	});
