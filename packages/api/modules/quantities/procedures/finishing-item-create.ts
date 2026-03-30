import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createFinishingItem, createFinishingItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertFinishingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemSchema = z.object({
	category: z.string().trim().max(200),
	subCategory: z.string().trim().max(100).optional(),
	name: z.string().trim().max(200),
	description: z.string().trim().max(2000).optional(),
	floorId: z.string().trim().max(100).optional(),
	floorName: z.string().trim().max(100).optional(),
	area: z.number().nonnegative().optional(),
	length: z.number().nonnegative().optional(),
	height: z.number().nonnegative().optional(),
	width: z.number().nonnegative().optional(),
	perimeter: z.number().nonnegative().optional(),
	quantity: z.number().nonnegative().optional(),
	unit: z.string().trim().max(50).default("m2"),
	calculationMethod: z.string().trim().max(100).optional(),
	calculationData: z.record(z.string(), z.unknown()).optional(),
	qualityLevel: z.string().trim().max(100).optional(),
	brand: z.string().trim().max(100).optional(),
	specifications: z.string().trim().max(100).optional(),
	wastagePercent: z.number().min(0).max(100).default(0),
	materialPrice: z.number().nonnegative().default(0),
	laborPrice: z.number().nonnegative().default(0),
	materialCost: z.number().nonnegative().default(0),
	laborCost: z.number().nonnegative().default(0),
	totalCost: z.number().nonnegative().default(0),
	dataSource: z.string().trim().max(100).optional(),
	sourceItemId: z.string().trim().max(100).optional(),
	sourceFormula: z.string().trim().max(100).optional(),
	isEnabled: z.boolean().default(true),
	sortOrder: z.number().nonnegative().default(0),
	groupKey: z.string().trim().max(100).optional(),
	scope: z.string().trim().max(100).optional(),
});

export const finishingItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/finishing-items",
		tags: ["Quantities"],
		summary: "Create finishing item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
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
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const { organizationId, ...data } = input;

		const item = await createFinishingItem(data);

		return convertFinishingItemDecimals(item);
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
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
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
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await createFinishingItemsBatch(input.costStudyId, input.items);

		return { success: true, count: input.items.length };
	});
