import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createMEPItem, createMEPItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertMEPItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

const mepItemSchema = z.object({
	category: z.string(),
	subCategory: z.string().default("general"),
	itemType: z.string().nullable().optional(),
	name: z.string(),
	floorId: z.string().nullable().optional(),
	floorName: z.string().nullable().optional(),
	roomId: z.string().nullable().optional(),
	roomName: z.string().nullable().optional(),
	scope: z.string().default("per_room"),
	quantity: z.number().nonnegative().default(0),
	unit: z.string().default("عدد"),
	length: z.number().nonnegative().nullable().optional(),
	area: z.number().nonnegative().nullable().optional(),
	calculationMethod: z.string().default("manual"),
	calculationData: z.any().optional(),
	dataSource: z.string().default("manual"),
	sourceFormula: z.string().nullable().optional(),
	groupKey: z.string().nullable().optional(),
	specifications: z.string().nullable().optional(),
	specData: z.any().optional(),
	qualityLevel: z.string().nullable().optional(),
	materialPrice: z.number().nonnegative().default(0),
	laborPrice: z.number().nonnegative().default(0),
	wastagePercent: z.number().min(0).max(100).default(10),
	isEnabled: z.boolean().default(true),
	sortOrder: z.number().nonnegative().default(0),
});

export const mepItemCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/mep-items",
		tags: ["Quantities"],
		summary: "Create MEP item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
		}).merge(mepItemSchema),
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

		const { organizationId, ...data } = input;

		const item = await createMEPItem(data);

		return convertMEPItemDecimals(item);
	});

export const mepItemCreateBatch = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/mep-items/batch",
		tags: ["Quantities"],
		summary: "Create MEP items in batch",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			items: z.array(mepItemSchema),
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

		await createMEPItemsBatch(input.costStudyId, input.items);

		return { success: true, count: input.items.length };
	});
