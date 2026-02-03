import { ORPCError } from "@orpc/server";
import { deleteStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const structuralItemDelete = protectedProcedure
	.route({
		method: "DELETE",
		path: "/quantities/{costStudyId}/structural-items/{id}",
		tags: ["Quantities"],
		summary: "Delete structural item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		await deleteStructuralItem(input.id, input.costStudyId);

		return { success: true };
	});
