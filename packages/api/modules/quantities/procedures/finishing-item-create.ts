import { ORPCError } from "@orpc/server";
import { createFinishingItem, createFinishingItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemSchema = z.object({
	category: z.string(),
	subCategory: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	floorId: z.string().optional(),
	floorName: z.string().optional(),
	area: z.number().optional(),
	length: z.number().optional(),
	height: z.number().optional(),
	width: z.number().optional(),
	perimeter: z.number().optional(),
	quantity: z.number().optional(),
	unit: z.string().default("m2"),
	calculationMethod: z.string().optional(),
	calculationData: z.any().optional(),
	qualityLevel: z.string().optional(),
	brand: z.string().optional(),
	specifications: z.string().optional(),
	wastagePercent: z.number().default(0),
	materialPrice: z.number().default(0),
	laborPrice: z.number().default(0),
	materialCost: z.number().default(0),
	laborCost: z.number().default(0),
	totalCost: z.number().default(0),
	dataSource: z.string().optional(),
	sourceItemId: z.string().optional(),
	sourceFormula: z.string().optional(),
	isEnabled: z.boolean().default(true),
	sortOrder: z.number().default(0),
	groupKey: z.string().optional(),
	scope: z.string().optional(),
});

function convertFinishingItemDecimals(item: Record<string, unknown>) {
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
		materialCost: Number(item.materialCost ?? 0),
		laborCost: Number(item.laborCost ?? 0),
		totalCost: Number(item.totalCost ?? 0),
	};
}

export const finishingItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/finishing-items",
		tags: ["Quantities"],
		summary: "Create finishing item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
		}).merge(finishingItemSchema),
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

		const { organizationId, ...data } = input;

		const item = await createFinishingItem(data);

		return convertFinishingItemDecimals(item as unknown as Record<string, unknown>);
	});

export const finishingItemCreateBatch = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/finishing-items/batch",
		tags: ["Quantities"],
		summary: "Create finishing items in batch",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			items: z.array(finishingItemSchema),
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

		await createFinishingItemsBatch(input.costStudyId, input.items);

		return { success: true };
	});
