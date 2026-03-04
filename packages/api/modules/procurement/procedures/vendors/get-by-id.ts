import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const vendorsGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/vendors/{vendorId}",
		tags: ["Procurement", "Vendors"],
		summary: "Get vendor details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			vendorId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const vendor = await db.vendor.findFirst({
			where: {
				id: input.vendorId,
				organizationId: input.organizationId,
			},
			include: {
				createdBy: { select: { id: true, name: true } },
				purchaseOrders: {
					select: {
						id: true,
						poNumber: true,
						status: true,
						totalAmount: true,
						createdAt: true,
					},
					orderBy: { createdAt: "desc" },
					take: 10,
				},
				vendorInvoices: {
					select: {
						id: true,
						invoiceNumber: true,
						status: true,
						totalAmount: true,
						paidAmount: true,
						createdAt: true,
					},
					orderBy: { createdAt: "desc" },
					take: 10,
				},
			},
		});

		if (!vendor) {
			throw new ORPCError("NOT_FOUND", { message: "المورد غير موجود" });
		}

		return {
			...vendor,
			rating: vendor.rating ? Number(vendor.rating) : null,
			purchaseOrders: vendor.purchaseOrders.map((po) => ({
				...po,
				totalAmount: Number(po.totalAmount),
			})),
			vendorInvoices: vendor.vendorInvoices.map((vi) => ({
				...vi,
				totalAmount: Number(vi.totalAmount),
				paidAmount: Number(vi.paidAmount),
			})),
		};
	});
