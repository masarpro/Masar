import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/purchase-orders/{orderId}",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Update a purchase order (draft only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			orderId: z.string(),
			expectedDelivery: z.coerce.date().nullish(),
			vatPercent: z.number().min(0).max(100).optional(),
			discountPercent: z.number().min(0).max(100).optional(),
			paymentTerms: z.string().nullish(),
			deliveryTerms: z.string().nullish(),
			warrantyTerms: z.string().nullish(),
			notes: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "order",
		});

		const existing = await db.purchaseOrder.findFirst({
			where: { id: input.orderId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "أمر الشراء غير موجود",
			});
		}
		if (existing.status !== "PO_DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تعديل أمر شراء غير مسودة",
			});
		}

		const { organizationId, orderId, ...data } = input;

		// Recalculate totals if discount/vat changed
		const updates: any = { ...data };
		if (data.discountPercent !== undefined || data.vatPercent !== undefined) {
			const subtotal = Number(existing.subtotal);
			const discountPct = data.discountPercent ?? Number(existing.discountPercent);
			const vatPct = data.vatPercent ?? Number(existing.vatPercent);
			const discountAmount = subtotal * (discountPct / 100);
			const afterDiscount = subtotal - discountAmount;
			const vatAmount = afterDiscount * (vatPct / 100);
			updates.discountAmount = discountAmount;
			updates.vatAmount = vatAmount;
			updates.totalAmount = afterDiscount + vatAmount;
		}

		const po = await db.purchaseOrder.update({
			where: { id: orderId },
			data: updates,
		});

		return {
			...po,
			subtotal: Number(po.subtotal),
			discountPercent: Number(po.discountPercent),
			discountAmount: Number(po.discountAmount),
			vatPercent: Number(po.vatPercent),
			vatAmount: Number(po.vatAmount),
			totalAmount: Number(po.totalAmount),
		};
	});
