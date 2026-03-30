import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { duplicateCostStudy as duplicateCostStudyQuery } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const duplicate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/duplicate",
		tags: ["Quantities"],
		summary: "Duplicate cost study",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		await enforceFeatureAccess(input.organizationId, "cost-study.save", context.user);

		try {
			const study = await duplicateCostStudyQuery(
				input.id,
				input.organizationId,
				context.user.id,
			);

			return convertStudyDecimals(study);
		} catch {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}
	});
