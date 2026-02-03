import { ORPCError } from "@orpc/server";
import { getCostStudyById, recalculateCostStudyTotals } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const recalculate = protectedProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/recalculate",
		tags: ["Quantities"],
		summary: "Recalculate cost study totals",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.id, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		await recalculateCostStudyTotals(input.id);

		return { success: true };
	});
