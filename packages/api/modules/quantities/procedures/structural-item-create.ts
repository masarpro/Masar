import { ORPCError } from "@orpc/server";
import { createStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const structuralItemCreate = protectedProcedure
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
			quantity: z.number(),
			unit: z.string(),
			concreteVolume: z.number().optional(),
			concreteType: z.string().optional(),
			steelWeight: z.number().optional(),
			steelRatio: z.number().optional(),
			wastagePercent: z.number().default(10),
			materialCost: z.number().default(0),
			laborCost: z.number().default(0),
			totalCost: z.number().default(0),
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

		return {
			...item,
			quantity: Number(item.quantity),
			concreteVolume: item.concreteVolume ? Number(item.concreteVolume) : null,
			steelWeight: item.steelWeight ? Number(item.steelWeight) : null,
			steelRatio: item.steelRatio ? Number(item.steelRatio) : null,
			wastagePercent: Number(item.wastagePercent),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
		};
	});
