import { ORPCError } from "@orpc/server";
import { updateStructuralItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const structuralItemUpdate = protectedProcedure
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
			quantity: z.number().optional(),
			unit: z.string().optional(),
			concreteVolume: z.number().optional(),
			concreteType: z.string().optional(),
			steelWeight: z.number().optional(),
			steelRatio: z.number().optional(),
			wastagePercent: z.number().optional(),
			materialCost: z.number().optional(),
			laborCost: z.number().optional(),
			totalCost: z.number().optional(),
			sortOrder: z.number().optional(),
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

		const { organizationId, costStudyId, id, ...data } = input;

		const item = await updateStructuralItem(id, costStudyId, data);

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
