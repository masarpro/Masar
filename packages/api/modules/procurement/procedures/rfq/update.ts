import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/rfq/{rfqId}",
		tags: ["Procurement", "RFQ"],
		summary: "Update an RFQ (draft only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			rfqId: z.string(),
			title: z.string().min(1).optional(),
			description: z.string().nullish(),
			status: z
				.enum([
					"RFQ_DRAFT",
					"SENT",
					"RESPONSES_RECEIVED",
					"EVALUATED",
					"AWARDED",
					"RFQ_CANCELLED",
				])
				.optional(),
			responseDeadline: z.coerce.date().nullish(),
			notes: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "order",
		});

		const existing = await db.rFQ.findFirst({
			where: { id: input.rfqId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب عرض السعر غير موجود",
			});
		}

		const { organizationId, rfqId, ...data } = input;
		const rfq = await db.rFQ.update({
			where: { id: rfqId },
			data,
		});

		return rfq;
	});
