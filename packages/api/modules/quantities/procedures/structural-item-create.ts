import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertStructuralItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const structuralItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/structural-items",
		tags: ["Quantities"],
		summary: "Create structural item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			category: z.string(),
			subCategory: z.string().optional(),
			name: z.string(),
			description: z.string().optional(),
			dimensions: z.any().optional(),
			quantity: z.number().nonnegative(),
			unit: z.string(),
			concreteVolume: z.number().nonnegative().optional(),
			concreteType: z.string().optional(),
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
