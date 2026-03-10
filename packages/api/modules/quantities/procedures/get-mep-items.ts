import { getCostStudyMEPItems } from "@repo/database";
import { z } from "zod";
import { convertMEPItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getMEPItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/mep-items",
		tags: ["Quantities"],
		summary: "Get MEP items for a cost study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const items = await getCostStudyMEPItems(input.costStudyId, input.organizationId);
		return items.map(convertMEPItemDecimals);
	});
