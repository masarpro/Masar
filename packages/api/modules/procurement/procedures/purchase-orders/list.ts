import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/purchase-orders",
		tags: ["Procurement", "Purchase Orders"],
		summary: "List purchase orders",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			vendorId: z.string().optional(),
			status: z
				.enum([
					"PO_DRAFT",
					"PO_PENDING_APPROVAL",
					"PO_APPROVED",
					"PO_SENT",
					"PO_PARTIALLY_RECEIVED",
					"PO_FULLY_RECEIVED",
					"PO_CLOSED",
					"PO_CANCELLED",
				])
				.optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const where: any = { organizationId: input.organizationId };
		if (input.projectId) where.projectId = input.projectId;
		if (input.vendorId) where.vendorId = input.vendorId;
		if (input.status) where.status = input.status;
		if (input.query) {
			where.OR = [
				{ poNumber: { contains: input.query, mode: "insensitive" } },
				{
					vendor: {
						name: { contains: input.query, mode: "insensitive" },
					},
				},
			];
		}

		const [orders, total] = await Promise.all([
			db.purchaseOrder.findMany({
				where,
				include: {
					project: { select: { id: true, name: true } },
					vendor: { select: { id: true, name: true, code: true } },
					approvedBy: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
					_count: {
						select: { items: true, goodsReceipts: true, vendorInvoices: true },
					},
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.purchaseOrder.count({ where }),
		]);

		return {
			orders: orders.map((o) => ({
				...o,
				subtotal: Number(o.subtotal),
				discountPercent: Number(o.discountPercent),
				discountAmount: Number(o.discountAmount),
				vatPercent: Number(o.vatPercent),
				vatAmount: Number(o.vatAmount),
				totalAmount: Number(o.totalAmount),
			})),
			total,
		};
	});
