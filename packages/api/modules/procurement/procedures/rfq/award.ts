import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqAward = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/rfq/{rfqId}/award",
		tags: ["Procurement", "RFQ"],
		summary: "Award an RFQ to a vendor",
	})
	.input(
		z.object({
			organizationId: z.string(),
			rfqId: z.string(),
			vendorId: z.string(),
			awardNotes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "approve",
		});

		const rfq = await db.rFQ.findFirst({
			where: { id: input.rfqId, organizationId: input.organizationId },
		});
		if (!rfq) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب عرض السعر غير موجود",
			});
		}

		// Check the vendor has a response
		const response = await db.rFQVendorResponse.findUnique({
			where: {
				rfqId_vendorId: {
					rfqId: input.rfqId,
					vendorId: input.vendorId,
				},
			},
		});
		if (!response) {
			throw new ORPCError("BAD_REQUEST", {
				message: "المورد المحدد ليس لديه رد على هذا الطلب",
			});
		}

		await db.$transaction(async (tx) => {
			// Mark all responses as not selected
			await tx.rFQVendorResponse.updateMany({
				where: { rfqId: input.rfqId },
				data: { isSelected: false },
			});

			// Mark winning response
			await tx.rFQVendorResponse.update({
				where: { id: response.id },
				data: { isSelected: true },
			});

			// Update RFQ
			await tx.rFQ.update({
				where: { id: input.rfqId },
				data: {
					status: "AWARDED",
					awardedVendorId: input.vendorId,
					awardNotes: input.awardNotes,
				},
			});
		});

		return { success: true };
	});
