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
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			category: z.string().trim().max(100).optional(),
			subCategory: z.string().trim().max(100).optional(),
			itemType: z.string().trim().max(100).nullable().optional(),
			name: z.string().trim().max(100).optional(),
			floorId: z.string().trim().max(100).nullable().optional(),
			floorName: z.string().trim().max(100).nullable().optional(),
			roomId: z.string().trim().max(100).nullable().optional(),
			roomName: z.string().trim().max(100).nullable().optional(),
			scope: z.string().trim().max(100).optional(),
			quantity: z.number().nonnegative().optional(),
			unit: z.string().trim().max(100).optional(),
			length: z.number().nonnegative().nullable().optional(),
			area: z.number().nonnegative().nullable().optional(),
			calculationMethod: z.string().trim().max(100).optional(),
			calculationData: z.record(z.string(), z.unknown()).optional(),
			dataSource: z.string().trim().max(100).optional(),
			sourceFormula: z.string().trim().max(100).nullable().optional(),
			groupKey: z.string().trim().max(100).nullable().optional(),
			specifications: z.string().trim().max(100).nullable().optional(),
			specData: z.record(z.string(), z.unknown()).optional(),
			qualityLevel: z.string().trim().max(100).nullable().optional(),
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
