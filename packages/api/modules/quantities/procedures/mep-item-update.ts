import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { updateMEPItem, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertMEPItemDecimals } from "../../../lib/decimal-helpers";
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
			quantity: z.number().nonnegative().optional(),
			unit: z.string().optional(),
			length: z.number().nonnegative().nullable().optional(),
			area: z.number().nonnegative().nullable().optional(),
			calculationMethod: z.string().optional(),
			calculationData: z.any().optional(),
			dataSource: z.string().optional(),
			sourceFormula: z.string().nullable().optional(),
			groupKey: z.string().nullable().optional(),
			specifications: z.string().nullable().optional(),
			specData: z.any().optional(),
			qualityLevel: z.string().nullable().optional(),
			materialPrice: z.number().nonnegative().optional(),
			laborPrice: z.number().nonnegative().optional(),
			wastagePercent: z.number().min(0).max(100).optional(),
			isEnabled: z.boolean().optional(),
			sortOrder: z.number().nonnegative().optional(),
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

		const item = await updateMEPItem(id, costStudyId, data);

		return convertMEPItemDecimals(item);
	});
