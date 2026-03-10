import { getCostStudyFinishingItems } from "@repo/database";
import { z } from "zod";
import { convertFinishingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getFinishingItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/finishing-items",
		tags: ["Quantities"],
		summary: "Get finishing items for a cost study",
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

		const items = await getCostStudyFinishingItems(input.costStudyId, input.organizationId);
		return items.map(convertFinishingItemDecimals);
	});
