import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createFinishingItem, createFinishingItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertFinishingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemSchema = z.object({
	category: z.string(),
	subCategory: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	floorId: z.string().optional(),
	floorName: z.string().optional(),
	area: z.number().nonnegative().optional(),
	length: z.number().nonnegative().optional(),
	height: z.number().nonnegative().optional(),
	width: z.number().nonnegative().optional(),
	perimeter: z.number().nonnegative().optional(),
	quantity: z.number().nonnegative().optional(),
	unit: z.string().default("m2"),
	calculationMethod: z.string().optional(),
	calculationData: z.any().optional(),
	qualityLevel: z.string().optional(),
	brand: z.string().optional(),
	specifications: z.string().optional(),
	wastagePercent: z.number().min(0).max(100).default(0),
	materialPrice: z.number().nonnegative().default(0),
	laborPrice: z.number().nonnegative().default(0),
	materialCost: z.number().nonnegative().default(0),
	laborCost: z.number().nonnegative().default(0),
	totalCost: z.number().nonnegative().default(0),
	dataSource: z.string().optional(),
	sourceItemId: z.string().optional(),
	sourceFormula: z.string().optional(),
	isEnabled: z.boolean().default(true),
	sortOrder: z.number().nonnegative().default(0),
	groupKey: z.string().optional(),
	scope: z.string().optional(),
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
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await createFinishingItemsBatch(input.costStudyId, input.items);

		return { success: true, count: input.items.length };
	});
