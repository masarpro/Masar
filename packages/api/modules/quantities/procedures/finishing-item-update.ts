import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { updateFinishingItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertFinishingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const finishingItemUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/finishing-items/{id}",
		tags: ["Quantities"],
		summary: "Update finishing item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			category: z.string().trim().max(100).optional(),
			subCategory: z.string().trim().max(100).optional(),
			name: z.string().trim().max(100).optional(),
			description: z.string().trim().max(2000).optional(),
			floorId: z.string().trim().max(100).optional(),
			floorName: z.string().trim().max(100).optional(),
			area: z.number().nonnegative().optional(),
			length: z.number().nonnegative().optional(),
			height: z.number().nonnegative().optional(),
			width: z.number().nonnegative().optional(),
			perimeter: z.number().nonnegative().optional(),
			quantity: z.number().nonnegative().optional(),
			unit: z.string().trim().max(100).optional(),
			calculationMethod: z.string().trim().max(100).optional(),
			calculationData: z.record(z.string(), z.unknown()).optional(),
			qualityLevel: z.string().trim().max(100).optional(),
			brand: z.string().trim().max(100).optional(),
			specifications: z.string().trim().max(100).optional(),
			specData: z.record(z.string(), z.unknown()).optional(),
			wastagePercent: z.number().min(0).max(100).optional(),
			materialPrice: z.number().nonnegative().optional(),
			laborPrice: z.number().nonnegative().optional(),
			materialCost: z.number().nonnegative().optional(),
			laborCost: z.number().nonnegative().optional(),
			totalCost: z.number().nonnegative().optional(),
			sortOrder: z.number().nonnegative().optional(),
			dataSource: z.string().trim().max(100).optional(),
			sourceItemId: z.string().trim().max(100).optional(),
			sourceFormula: z.string().trim().max(100).optional(),
			isEnabled: z.boolean().optional(),
			groupKey: z.string().trim().max(100).optional(),
			scope: z.string().trim().max(100).optional(),
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

		const { organizationId, costStudyId, id, ...data } = input;

		const item = await updateFinishingItem(id, costStudyId, data);

		return convertFinishingItemDecimals(item);
	});
