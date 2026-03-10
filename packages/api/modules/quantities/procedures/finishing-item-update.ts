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
			organizationId: z.string(),
			costStudyId: z.string(),
			id: z.string(),
			category: z.string().optional(),
			subCategory: z.string().optional(),
			name: z.string().optional(),
			description: z.string().optional(),
			floorId: z.string().optional(),
			floorName: z.string().optional(),
			area: z.number().nonnegative().optional(),
			length: z.number().nonnegative().optional(),
			height: z.number().nonnegative().optional(),
			width: z.number().nonnegative().optional(),
			perimeter: z.number().nonnegative().optional(),
			quantity: z.number().nonnegative().optional(),
			unit: z.string().optional(),
			calculationMethod: z.string().optional(),
			calculationData: z.any().optional(),
			qualityLevel: z.string().optional(),
			brand: z.string().optional(),
			specifications: z.string().optional(),
			specData: z.any().optional(),
			wastagePercent: z.number().min(0).max(100).optional(),
			materialPrice: z.number().nonnegative().optional(),
			laborPrice: z.number().nonnegative().optional(),
			materialCost: z.number().nonnegative().optional(),
			laborCost: z.number().nonnegative().optional(),
			totalCost: z.number().nonnegative().optional(),
			sortOrder: z.number().nonnegative().optional(),
			dataSource: z.string().optional(),
			sourceItemId: z.string().optional(),
			sourceFormula: z.string().optional(),
			isEnabled: z.boolean().optional(),
			groupKey: z.string().optional(),
			scope: z.string().optional(),
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
