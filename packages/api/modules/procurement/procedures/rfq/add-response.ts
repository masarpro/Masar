import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const rfqAddResponse = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/rfq/{rfqId}/responses",
		tags: ["Procurement", "RFQ"],
		summary: "Add a vendor response to an RFQ",
	})
	.input(
		z.object({
			organizationId: z.string(),
			rfqId: z.string(),
			vendorId: z.string(),
			items: z.any(), // [{rfqItemId, unitPrice, totalPrice, notes, deliveryDays}]
			totalAmount: z.number().min(0),
			deliveryDays: z.number().int().positive().optional(),
			paymentTerms: z.string().optional(),
			validUntil: z.coerce.date().optional(),
			warrantyTerms: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "order",
		});

		const rfq = await db.rFQ.findFirst({
			where: { id: input.rfqId, organizationId: input.organizationId },
		});
		if (!rfq) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب عرض السعر غير موجود",
			});
		}

		const vendor = await db.vendor.findFirst({
			where: { id: input.vendorId, organizationId: input.organizationId },
		});
		if (!vendor) {
			throw new ORPCError("NOT_FOUND", { message: "المورد غير موجود" });
		}

		// Check for duplicate response
		const existingResponse = await db.rFQVendorResponse.findUnique({
			where: {
				rfqId_vendorId: {
					rfqId: input.rfqId,
					vendorId: input.vendorId,
				},
			},
		});
		if (existingResponse) {
			throw new ORPCError("CONFLICT", {
				message: "يوجد رد سابق من هذا المورد. يمكنك تحديثه بدلاً من ذلك",
			});
		}

		const response = await db.rFQVendorResponse.create({
			data: {
				rfqId: input.rfqId,
				vendorId: input.vendorId,
				items: input.items,
				totalAmount: input.totalAmount,
				deliveryDays: input.deliveryDays,
				paymentTerms: input.paymentTerms,
				validUntil: input.validUntil,
				warrantyTerms: input.warrantyTerms,
			},
			include: {
				vendor: { select: { id: true, name: true, code: true } },
			},
		});

		// Auto-update RFQ status if still SENT
		if (rfq.status === "SENT") {
			await db.rFQ.update({
				where: { id: input.rfqId },
				data: { status: "RESPONSES_RECEIVED" },
			});
		}

		return {
			...response,
			totalAmount: Number(response.totalAmount),
		};
	});
