import { getCostStudyMEPItems } from "@repo/database";
import { z } from "zod";
import { convertMEPItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { hasCostingReadAccess, stripItemMoney } from "../lib/pricing-access";

export const getMEPItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/mep-items",
		tags: ["Quantities"],
		summary: "Get MEP items for a cost study",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);
		const showMoney = hasCostingReadAccess(permissions);

		const items = await getCostStudyMEPItems(input.costStudyId, input.organizationId);
		return items.map((item) => stripItemMoney(convertMEPItemDecimals(item), showMoney));
	});
