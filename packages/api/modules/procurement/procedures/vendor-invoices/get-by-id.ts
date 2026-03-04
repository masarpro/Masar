import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const viGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/vendor-invoices/{invoiceId}",
		tags: ["Procurement", "Vendor Invoices"],
		summary: "Get vendor invoice details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const vi = await db.vendorInvoice.findFirst({
			where: { id: input.invoiceId, organizationId: input.organizationId },
			include: {
				vendor: true,
				project: { select: { id: true, name: true, slug: true } },
				purchaseOrder: {
					select: { id: true, poNumber: true, totalAmount: true },
				},
				approvedBy: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				financeExpense: {
					select: {
						id: true,
						expenseNo: true,
						status: true,
						paidAmount: true,
						sourceAccount: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!vi) {
			throw new ORPCError("NOT_FOUND", {
				message: "فاتورة المورد غير موجودة",
			});
		}

		return {
			...vi,
			subtotal: Number(vi.subtotal),
			vatPercent: Number(vi.vatPercent),
			vatAmount: Number(vi.vatAmount),
			totalAmount: Number(vi.totalAmount),
			paidAmount: Number(vi.paidAmount),
			vendor: vi.vendor
				? { ...vi.vendor, rating: vi.vendor.rating ? Number(vi.vendor.rating) : null }
				: null,
			purchaseOrder: vi.purchaseOrder
				? {
						...vi.purchaseOrder,
						totalAmount: Number(vi.purchaseOrder.totalAmount),
					}
				: null,
			items: vi.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
			financeExpense: vi.financeExpense
				? {
						...vi.financeExpense,
						paidAmount: Number(vi.financeExpense.paidAmount),
					}
				: null,
		};
	});
