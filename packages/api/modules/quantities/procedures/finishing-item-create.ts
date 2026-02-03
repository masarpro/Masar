import { ORPCError } from "@orpc/server";
import { createFinishingItem, createFinishingItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const finishingItemSchema = z.object({
	category: z.string(),
	subCategory: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	area: z.number(),
	unit: z.string(),
	wastagePercent: z.number().default(8),
	qualityLevel: z.string().default("medium"),
	materialPrice: z.number().default(0),
	laborPrice: z.number().default(0),
	materialCost: z.number().default(0),
	laborCost: z.number().default(0),
	totalCost: z.number().default(0),
});

export const finishingItemCreate = protectedProcedure
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
			{ section: "quantities", action: "edit" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const { organizationId, ...data } = input;

		const item = await createFinishingItem(data);

		return {
			...item,
			area: Number(item.area),
			wastagePercent: Number(item.wastagePercent),
			materialPrice: Number(item.materialPrice),
			laborPrice: Number(item.laborPrice),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
		};
	});

export const finishingItemCreateBatch = protectedProcedure
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
			{ section: "quantities", action: "edit" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		await createFinishingItemsBatch(input.costStudyId, input.items);

		return { success: true };
	});
