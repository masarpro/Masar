import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { updateCostStudy as updateCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const update = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Update cost study",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
			name: z.string().optional(),
			customerName: z.string().optional(),
			customerId: z.string().optional(),
			projectType: z.string().optional(),
			landArea: z.number().positive().optional(),
			buildingArea: z.number().positive().optional(),
			numberOfFloors: z.number().int().positive().optional(),
			hasBasement: z.boolean().optional(),
			finishingLevel: z.string().optional(),
			overheadPercent: z.number().min(0).max(100).optional(),
			profitPercent: z.number().min(0).max(100).optional(),
			contingencyPercent: z.number().min(0).max(100).optional(),
			vatIncluded: z.boolean().optional(),
			status: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		await enforceFeatureAccess(input.organizationId, "cost-study.save", context.user);

		const { id, organizationId, ...data } = input;

		try {
			const study = await updateCostStudyQuery(id, organizationId, data);

			return convertStudyDecimals(study);
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}
	});
