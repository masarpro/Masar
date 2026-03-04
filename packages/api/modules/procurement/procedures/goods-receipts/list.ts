import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const grList = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/goods-receipts",
		tags: ["Procurement", "Goods Receipts"],
		summary: "List goods receipts",
	})
	.input(
		z.object({
			organizationId: z.string(),
			purchaseOrderId: z.string().optional(),
			status: z
				.enum([
					"PENDING_INSPECTION",
					"GR_ACCEPTED",
					"PARTIALLY_ACCEPTED",
					"GR_REJECTED",
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
		if (input.purchaseOrderId) where.purchaseOrderId = input.purchaseOrderId;
		if (input.status) where.status = input.status;
		if (input.query) {
			where.grNumber = { contains: input.query, mode: "insensitive" };
		}

		const [receipts, total] = await Promise.all([
			db.goodsReceipt.findMany({
				where,
				include: {
					purchaseOrder: {
						select: {
							id: true,
							poNumber: true,
							vendor: { select: { id: true, name: true } },
							project: { select: { id: true, name: true } },
						},
					},
					inspectedBy: { select: { id: true, name: true } },
					createdBy: { select: { id: true, name: true } },
					_count: { select: { items: true } },
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.goodsReceipt.count({ where }),
		]);

		return { receipts, total };
	});
