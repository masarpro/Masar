import { ORPCError } from "@orpc/server";
import { updateMEPItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const mepItemUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/mep-items/{id}",
		tags: ["Quantities"],
		summary: "Update MEP item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			id: z.string(),
			category: z.string().optional(),
			subCategory: z.string().optional(),
			itemType: z.string().nullable().optional(),
			name: z.string().optional(),
			floorId: z.string().nullable().optional(),
			floorName: z.string().nullable().optional(),
			roomId: z.string().nullable().optional(),
			roomName: z.string().nullable().optional(),
			scope: z.string().optional(),
			quantity: z.number().optional(),
			unit: z.string().optional(),
			length: z.number().nullable().optional(),
			area: z.number().nullable().optional(),
			calculationMethod: z.string().optional(),
			calculationData: z.any().optional(),
			dataSource: z.string().optional(),
			sourceFormula: z.string().nullable().optional(),
			groupKey: z.string().nullable().optional(),
			specifications: z.string().nullable().optional(),
			specData: z.any().optional(),
			qualityLevel: z.string().nullable().optional(),
			materialPrice: z.number().optional(),
			laborPrice: z.number().optional(),
			wastagePercent: z.number().optional(),
			isEnabled: z.boolean().optional(),
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

		const item = await updateMEPItem(id, costStudyId, data);

		return {
			...item,
			quantity: Number(item.quantity),
			length: item.length != null ? Number(item.length) : null,
			area: item.area != null ? Number(item.area) : null,
			wastagePercent: Number(item.wastagePercent),
			materialPrice: Number(item.materialPrice),
			laborPrice: Number(item.laborPrice),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			unitPrice: Number(item.unitPrice),
			totalCost: Number(item.totalCost),
		};
	});
