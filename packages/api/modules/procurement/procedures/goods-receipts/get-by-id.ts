import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const grGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/goods-receipts/{receiptId}",
		tags: ["Procurement", "Goods Receipts"],
		summary: "Get goods receipt details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			receiptId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const gr = await db.goodsReceipt.findFirst({
			where: { id: input.receiptId, organizationId: input.organizationId },
			include: {
				purchaseOrder: {
					include: {
						vendor: { select: { id: true, name: true, code: true } },
						project: { select: { id: true, name: true } },
					},
				},
				inspectedBy: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
				items: true,
			},
		});

		if (!gr) {
			throw new ORPCError("NOT_FOUND", {
				message: "إذن الاستلام غير موجود",
			});
		}

		return {
			...gr,
			items: gr.items.map((item) => ({
				...item,
				orderedQuantity: Number(item.orderedQuantity),
				receivedQuantity: Number(item.receivedQuantity),
				acceptedQuantity: Number(item.acceptedQuantity),
				rejectedQuantity: Number(item.rejectedQuantity),
			})),
		};
	});
