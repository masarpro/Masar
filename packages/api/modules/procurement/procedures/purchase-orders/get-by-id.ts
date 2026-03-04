import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/purchase-orders/{orderId}",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Get purchase order details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			orderId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const po = await db.purchaseOrder.findFirst({
			where: { id: input.orderId, organizationId: input.organizationId },
			include: {
				project: { select: { id: true, name: true, slug: true } },
				vendor: true,
				purchaseRequest: {
					select: { id: true, prNumber: true, title: true },
				},
				approvedBy: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				goodsReceipts: {
					select: {
						id: true,
						grNumber: true,
						status: true,
						receiptDate: true,
					},
					orderBy: { createdAt: "desc" },
				},
				vendorInvoices: {
					select: {
						id: true,
						invoiceNumber: true,
						status: true,
						totalAmount: true,
						paidAmount: true,
					},
					orderBy: { createdAt: "desc" },
				},
			},
		});

		if (!po) {
			throw new ORPCError("NOT_FOUND", {
				message: "أمر الشراء غير موجود",
			});
		}

		return {
			...po,
			subtotal: Number(po.subtotal),
			discountPercent: Number(po.discountPercent),
			discountAmount: Number(po.discountAmount),
			vatPercent: Number(po.vatPercent),
			vatAmount: Number(po.vatAmount),
			totalAmount: Number(po.totalAmount),
			vendor: po.vendor
				? { ...po.vendor, rating: po.vendor.rating ? Number(po.vendor.rating) : null }
				: null,
			items: po.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
				receivedQuantity: Number(item.receivedQuantity),
			})),
			vendorInvoices: po.vendorInvoices.map((vi) => ({
				...vi,
				totalAmount: Number(vi.totalAmount),
				paidAmount: Number(vi.paidAmount),
			})),
		};
	});
