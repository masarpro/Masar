import { getCostStudyStructuralItems } from "@repo/database";
import { z } from "zod";
import { convertStructuralItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getStructuralItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/structural-items",
		tags: ["Quantities"],
		summary: "Get structural items for a cost study",
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

		const items = await getCostStudyStructuralItems(input.costStudyId, input.organizationId);
		return items.map(convertStructuralItemDecimals);
	});
