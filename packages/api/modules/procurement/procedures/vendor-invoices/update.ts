import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/vendor-invoices/{invoiceId}",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "Update a vendor invoice (draft only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceId: z.string(),
			vendorInvoiceNo: z.string().nullish(),
			invoiceDate: z.coerce.date().optional(),
			dueDate: z.coerce.date().nullish(),
			notes: z.string().nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "invoice",
		});

		const existing = await db.vendorInvoice.findFirst({
			where: { id: input.invoiceId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "فاتورة المورد غير موجودة",
			});
		}
		if (existing.status !== "VI_DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تعديل فاتورة غير مسودة",
			});
		}

		const { organizationId, invoiceId, ...data } = input;
		const vi = await db.vendorInvoice.update({
			where: { id: invoiceId },
			data,
		});

		return {
			...vi,
			subtotal: Number(vi.subtotal),
			vatPercent: Number(vi.vatPercent),
			vatAmount: Number(vi.vatAmount),
			totalAmount: Number(vi.totalAmount),
			paidAmount: Number(vi.paidAmount),
		};
	});
