import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

// كتابة → subscriptionProcedure (كانت protectedProcedure بالخطأ)
export const updateConfig = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/config",
		tags: ["Quantities"],
		summary: "Update study configuration (type and scopes)",
	})
	.input(
		z.object({
			studyId: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			studyType: z
				.enum([
					"FULL_PROJECT",
					"CUSTOM_ITEMS",
					"LUMP_SUM_ANALYSIS",
					"FULL_STUDY",
					"COST_PRICING",
					"QUICK_PRICING",
				])
				.optional(),
			workScopes: z
				.array(z.enum(["STRUCTURAL", "FINISHING", "MEP", "CUSTOM"]))
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const data: Record<string, unknown> = {};
		if (input.studyType !== undefined) {
			data.studyType = input.studyType;
		}
		if (input.workScopes !== undefined) {
			data.workScopes = input.workScopes;
		}

		const existing = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const updated = await db.costStudy.update({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			data,
		});

		return convertStudyDecimals(updated);
	});
