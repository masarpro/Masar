import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { toggleMEPItemEnabled, getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertMEPItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const mepItemToggle = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{costStudyId}/mep-items/{id}/toggle",
		tags: ["Quantities"],
		summary: "Toggle MEP item enabled status",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			isEnabled: z.boolean(),
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

		const item = await toggleMEPItemEnabled(input.id, input.costStudyId, input.isEnabled);

		return convertMEPItemDecimals(item);
	});
