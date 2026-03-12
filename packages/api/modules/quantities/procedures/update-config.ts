import { db } from "@repo/database";
import { z } from "zod";
import { convertStudyDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateConfig = protectedProcedure
	.route({
		method: "POST",
		path: "/quantities/{id}/config",
		tags: ["Quantities"],
		summary: "Update study configuration (type and scopes)",
	})
	.input(
		z.object({
			studyId: z.string(),
			organizationId: z.string(),
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

		const updated = await db.costStudy.update({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			data,
		});

		return convertStudyDecimals(updated);
	});
