import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { updateStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertStructuralItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { structuralDimensionsUnion } from "../schemas/structural-dimensions";
import { validateStructuralBounds } from "../validators/structural-bounds";

export const structuralItemUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/structural-items/{id}",
		tags: ["Quantities"],
		summary: "Update structural item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			category: z.string().trim().max(100).optional(),
			subCategory: z.string().trim().max(100).optional(),
			name: z.string().trim().max(100).optional(),
			description: z.string().trim().max(2000).optional(),
			dimensions: structuralDimensionsUnion.optional(),
			quantity: z.number().nonnegative().optional(),
			unit: z.string().trim().max(100).optional(),
			concreteVolume: z.number().nonnegative().optional(),
			concreteType: z.string().trim().max(100).optional(),
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

		if (input.quantity !== undefined || input.concreteVolume !== undefined || input.steelWeight !== undefined || input.dimensions !== undefined) {
			validateStructuralBounds({
				category: input.category,
				quantity: input.quantity,
				concreteVolume: input.concreteVolume,
				steelWeight: input.steelWeight,
				dimensions: input.dimensions as Record<string, number | string> | undefined,
			});
		}

		const { organizationId, costStudyId, id, ...data } = input;

		const item = await updateStructuralItem(id, costStudyId, data);

		return convertStructuralItemDecimals(item);
	});
