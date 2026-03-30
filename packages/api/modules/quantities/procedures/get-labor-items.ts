import { getCostStudyLaborItems } from "@repo/database";
import { z } from "zod";
import { convertLaborItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getLaborItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/labor-items",
		tags: ["Quantities"],
		summary: "Get labor items for a cost study",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const items = await getCostStudyLaborItems(input.costStudyId, input.organizationId);
		return items.map(convertLaborItemDecimals);
	});
