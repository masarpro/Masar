import { ORPCError } from "@orpc/server";
import { updateFinishingItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const finishingItemUpdate = protectedProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/finishing-items/{id}",
		tags: ["Quantities"],
		summary: "Update finishing item",
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
			floorId: z.string().optional(),
			floorName: z.string().optional(),
			area: z.number().optional(),
			length: z.number().optional(),
			height: z.number().optional(),
			width: z.number().optional(),
			perimeter: z.number().optional(),
			quantity: z.number().optional(),
			unit: z.string().optional(),
			calculationMethod: z.string().optional(),
			calculationData: z.any().optional(),
			qualityLevel: z.string().optional(),
			brand: z.string().optional(),
			specifications: z.string().optional(),
			wastagePercent: z.number().optional(),
			materialPrice: z.number().optional(),
			laborPrice: z.number().optional(),
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
			{ section: "pricing", action: "studies" },
		);

		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const { organizationId, costStudyId, id, ...data } = input;

		const item = await updateFinishingItem(id, costStudyId, data);

		return {
			...item,
			area: item.area != null ? Number(item.area) : null,
			length: item.length != null ? Number(item.length) : null,
			height: item.height != null ? Number(item.height) : null,
			width: item.width != null ? Number(item.width) : null,
			perimeter: item.perimeter != null ? Number(item.perimeter) : null,
			quantity: item.quantity != null ? Number(item.quantity) : null,
			wastagePercent: item.wastagePercent != null ? Number(item.wastagePercent) : null,
			materialPrice: item.materialPrice != null ? Number(item.materialPrice) : null,
			laborPrice: item.laborPrice != null ? Number(item.laborPrice) : null,
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
		};
	});
