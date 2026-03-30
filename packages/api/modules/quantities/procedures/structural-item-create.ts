import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertStructuralItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { structuralDimensionsUnion } from "../schemas/structural-dimensions";
import { validateStructuralBounds } from "../validators/structural-bounds";

export const structuralItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/structural-items",
		tags: ["Quantities"],
		summary: "Create structural item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			category: z.string().trim().max(200),
			subCategory: z.string().trim().max(100).optional(),
			name: z.string().trim().max(200),
			description: z.string().trim().max(2000).optional(),
			dimensions: structuralDimensionsUnion.optional(),
			quantity: z.number().nonnegative(),
			unit: z.string().trim().max(200),
			concreteVolume: z.number().nonnegative().optional(),
			concreteType: z.string().trim().max(100).optional(),
			steelWeight: z.number().nonnegative().optional(),
			steelRatio: z.number().nonnegative().optional(),
			wastagePercent: z.number().min(0).max(100).default(10),
			materialCost: z.number().nonnegative().default(0),
			laborCost: z.number().nonnegative().default(0),
			totalCost: z.number().nonnegative().default(0),
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

		validateStructuralBounds({
			category: input.category,
			quantity: input.quantity,
			concreteVolume: input.concreteVolume,
			steelWeight: input.steelWeight,
			dimensions: input.dimensions as Record<string, number | string> | undefined,
		});

		const item = await createStructuralItem({
			costStudyId: input.costStudyId,
			category: input.category,
			subCategory: input.subCategory,
			name: input.name,
			description: input.description,
			dimensions: input.dimensions,
			quantity: input.quantity,
			unit: input.unit,
			concreteVolume: input.concreteVolume,
			concreteType: input.concreteType,
			steelWeight: input.steelWeight,
			steelRatio: input.steelRatio,
			wastagePercent: input.wastagePercent,
			materialCost: input.materialCost,
			laborCost: input.laborCost,
			totalCost: input.totalCost,
		});

		return convertStructuralItemDecimals(item);
	});
