import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const grInspect = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/goods-receipts/{receiptId}/inspect",
		tags: ["Procurement", "Goods Receipts"],
		summary: "Record inspection results for a goods receipt",
	})
	.input(
		z.object({
			organizationId: z.string(),
			receiptId: z.string(),
			inspectionNotes: z.string().optional(),
			items: z.array(
				z.object({
					itemId: z.string(),
					acceptedQuantity: z.number().min(0),
					rejectedQuantity: z.number().min(0).default(0),
					rejectionReason: z.string().optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "receive",
		});

		const gr = await db.goodsReceipt.findFirst({
			where: { id: input.receiptId, organizationId: input.organizationId },
			include: {
				items: true,
				purchaseOrder: { select: { id: true, poNumber: true } },
			},
		});
		if (!gr) {
			throw new ORPCError("NOT_FOUND", {
				message: "إذن الاستلام غير موجود",
			});
		}

		const hasRejections = input.items.some((i) => i.rejectedQuantity > 0);
		const allRejected = input.items.every(
			(i) => i.acceptedQuantity === 0 && i.rejectedQuantity > 0,
		);

		const newStatus = allRejected
			? "GR_REJECTED"
			: hasRejections
				? "PARTIALLY_ACCEPTED"
				: "GR_ACCEPTED";

		await db.$transaction(async (tx) => {
			// Update each GR item
			for (const item of input.items) {
				await tx.goodsReceiptItem.update({
					where: { id: item.itemId },
					data: {
						acceptedQuantity: item.acceptedQuantity,
						rejectedQuantity: item.rejectedQuantity,
						rejectionReason: item.rejectionReason,
					},
				});
			}

			// Update GR status
			await tx.goodsReceipt.update({
				where: { id: input.receiptId },
				data: {
					status: newStatus,
					inspectedById: context.user.id,
					inspectionDate: new Date(),
					inspectionNotes: input.inspectionNotes,
				},
			});

			// Update PO item received quantities
			for (const item of input.items) {
				const grItem = gr.items.find((i) => i.id === item.itemId);
				if (grItem) {
					await tx.purchaseOrderItem.update({
						where: { id: grItem.poItemId },
						data: {
							receivedQuantity: { increment: item.acceptedQuantity },
						},
					});
				}
			}

			// Check if PO is fully received
			const poItems = await tx.purchaseOrderItem.findMany({
				where: { purchaseOrderId: gr.purchaseOrderId },
			});
			const allFullyReceived = poItems.every(
				(i) => Number(i.receivedQuantity) >= Number(i.quantity),
			);
			const someReceived = poItems.some((i) => Number(i.receivedQuantity) > 0);

			if (allFullyReceived) {
				await tx.purchaseOrder.update({
					where: { id: gr.purchaseOrderId },
					data: { status: "PO_FULLY_RECEIVED" },
				});
			} else if (someReceived) {
				await tx.purchaseOrder.update({
					where: { id: gr.purchaseOrderId },
					data: { status: "PO_PARTIALLY_RECEIVED" },
				});
			}

			// Update PR item received quantities if linked
			for (const item of input.items) {
				const grItem = gr.items.find((i) => i.id === item.itemId);
				if (grItem) {
					const poItem = await tx.purchaseOrderItem.findUnique({
						where: { id: grItem.poItemId },
					});
					if (poItem?.prItemId) {
						await tx.purchaseRequestItem.update({
							where: { id: poItem.prItemId },
							data: {
								receivedQuantity: { increment: item.acceptedQuantity },
							},
						});
					}
				}
			}
		});

		const auditAction = allRejected ? "GR_REJECTED" : "GR_ACCEPTED";
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: auditAction,
			entityType: "GoodsReceipt",
			entityId: gr.id,
			metadata: { grNumber: gr.grNumber, status: newStatus },
		});

		return { success: true, status: newStatus };
	});
