import { getCostStudyQuotes } from "@repo/database";
import { z } from "zod";
import { convertQuoteDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { requireQuotationReadAccess } from "../lib/pricing-access";
import { protectedProcedure } from "../../../orpc/procedures";

export const getQuotes = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/quotes",
		tags: ["Quantities"],
		summary: "Get quotes for a cost study",
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
		// مبالغ العروض أسعار بيع — تتطلب صلاحية عروض أسعار فعلية
		requireQuotationReadAccess(permissions);

		const quotes = await getCostStudyQuotes(input.costStudyId, input.organizationId);
		return quotes.map(convertQuoteDecimals);
	});
