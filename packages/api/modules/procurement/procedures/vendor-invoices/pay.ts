import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viPay = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/vendor-invoices/{invoiceId}/pay",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "Record payment for a vendor invoice (updates FinanceExpense)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceId: z.string(),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر"),
			bankAccountId: z.string(),
			referenceNo: z.string().optional(),
			paymentDate: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "pay",
		});

		const vi = await db.vendorInvoice.findFirst({
			where: { id: input.invoiceId, organizationId: input.organizationId },
		});
		if (!vi) {
			throw new ORPCError("NOT_FOUND", {
				message: "فاتورة المورد غير موجودة",
			});
		}
		if (vi.status === "VI_PAID" || vi.status === "VI_CANCELLED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن دفع هذه الفاتورة",
			});
		}

		// Verify bank account
		const bankAccount = await db.organizationBank.findFirst({
			where: {
				id: input.bankAccountId,
				organizationId: input.organizationId,
				isActive: true,
			},
		});
		if (!bankAccount) {
			throw new ORPCError("NOT_FOUND", {
				message: "الحساب البنكي غير موجود",
			});
		}

		const totalAmount = Number(vi.totalAmount);
		const currentPaid = Number(vi.paidAmount);
		const newPaidAmount = currentPaid + input.amount;
		const remaining = totalAmount - newPaidAmount;

		if (newPaidAmount > totalAmount) {
			throw new ORPCError("BAD_REQUEST", {
				message: `مبلغ الدفعة يتجاوز المتبقي (${totalAmount - currentPaid} ر.س)`,
			});
		}

		const newStatus =
			remaining <= 0 ? "VI_PAID" : "VI_PARTIALLY_PAID";

		await db.$transaction(async (tx) => {
			// 1. Update vendor invoice
			await tx.vendorInvoice.update({
				where: { id: input.invoiceId },
				data: {
					paidAmount: newPaidAmount,
					status: newStatus,
				},
			});

			// 2. Update linked FinanceExpense
			if (vi.financeExpenseId) {
				await tx.financeExpense.update({
					where: { id: vi.financeExpenseId },
					data: {
						paidAmount: newPaidAmount,
						sourceAccountId: input.bankAccountId,
						status: remaining <= 0 ? "COMPLETED" : "PENDING",
						referenceNo: input.referenceNo,
					},
				});
			}

			// 3. Deduct from bank account balance
			await tx.organizationBank.update({
				where: { id: input.bankAccountId },
				data: {
					balance: { decrement: input.amount },
				},
			});
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "VENDOR_INVOICE_PAID",
			entityType: "VendorInvoice",
			entityId: vi.id,
			metadata: {
				invoiceNumber: vi.invoiceNumber,
				amount: input.amount,
				newPaidAmount,
				status: newStatus,
			},
		});

		return { success: true, status: newStatus, paidAmount: newPaidAmount };
	});
