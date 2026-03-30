import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { deleteStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const structuralItemDelete = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/quantities/{costStudyId}/structural-items/{id}",
		tags: ["Quantities"],
		summary: "Delete structural item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			id: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await deleteStructuralItem(input.id, input.costStudyId);

		return { success: true };
	});
