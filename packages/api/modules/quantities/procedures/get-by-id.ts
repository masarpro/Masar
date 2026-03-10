import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { getCostStudyById } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getById = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{id}",
		tags: ["Quantities"],
		summary: "Get cost study by ID",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const costStudy = await getCostStudyById(input.id, input.organizationId);

		if (!costStudy) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		return convertStudyDecimals(costStudy);
	});
