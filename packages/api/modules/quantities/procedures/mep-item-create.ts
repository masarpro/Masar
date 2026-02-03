import { ORPCError } from "@orpc/server";
import { createMEPItem, createMEPItemsBatch, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const mepItemSchema = z.object({
	category: z.string(),
	itemType: z.string(),
	name: z.string(),
	description: z.string().optional(),
	quantity: z.number(),
	unit: z.string(),
	unitPrice: z.number().default(0),
	totalCost: z.number().default(0),
});

export const mepItemCreate = protectedProcedure
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

		const item = await createMEPItem(data);

		return {
			...item,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			totalCost: Number(item.totalCost),
		};
	});

export const mepItemCreateBatch = protectedProcedure
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
			{ section: "quantities", action: "edit" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		await createMEPItemsBatch(input.costStudyId, input.items);

		return { success: true };
	});
