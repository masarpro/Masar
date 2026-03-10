import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { updateStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertStructuralItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const structuralItemUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/structural-items/{id}",
		tags: ["Quantities"],
		summary: "Update structural item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			id: z.string(),
			category: z.string().optional(),
			subCategory: z.string().optional(),
			name: z.string().optional(),
			description: z.string().optional(),
			dimensions: z.any().optional(),
			quantity: z.number().nonnegative().optional(),
			unit: z.string().optional(),
			concreteVolume: z.number().nonnegative().optional(),
			concreteType: z.string().optional(),
			steelWeight: z.number().nonnegative().optional(),
			steelRatio: z.number().nonnegative().optional(),
			wastagePercent: z.number().min(0).max(100).optional(),
			materialCost: z.number().nonnegative().optional(),
			laborCost: z.number().nonnegative().optional(),
			totalCost: z.number().nonnegative().optional(),
			sortOrder: z.number().nonnegative().optional(),
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

		const { organizationId, costStudyId, id, ...data } = input;

		const item = await updateStructuralItem(id, costStudyId, data);

		return convertStructuralItemDecimals(item);
	});
