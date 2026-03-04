import { db, generateAtomicNo, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const grCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/goods-receipts",
		tags: ["Procurement", "Goods Receipts"],
		summary: "Create a goods receipt for a purchase order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			purchaseOrderId: z.string(),
			deliveryNote: z.string().optional(),
			driverName: z.string().optional(),
			vehiclePlate: z.string().optional(),
			storageLocation: z.string().optional(),
			notes: z.string().optional(),
			items: z
				.array(
					z.object({
						poItemId: z.string(),
						name: z.string(),
						unit: z.string(),
						orderedQuantity: z.number(),
						receivedQuantity: z.number().min(0),
					}),
				)
				.min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "receive",
		});

		const po = await db.purchaseOrder.findFirst({
			where: {
				id: input.purchaseOrderId,
				organizationId: input.organizationId,
			},
		});
		if (!po) {
			throw new ORPCError("NOT_FOUND", {
				message: "أمر الشراء غير موجود",
			});
		}
		if (
			po.status !== "PO_SENT" &&
			po.status !== "PO_APPROVED" &&
			po.status !== "PO_PARTIALLY_RECEIVED"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تسجيل استلام لأمر الشراء في حالته الحالية",
			});
		}

		const grNumber = await generateAtomicNo(input.organizationId, "GR");

		const gr = await db.goodsReceipt.create({
			data: {
				organizationId: input.organizationId,
				purchaseOrderId: input.purchaseOrderId,
				grNumber,
				deliveryNote: input.deliveryNote,
				driverName: input.driverName,
				vehiclePlate: input.vehiclePlate,
				storageLocation: input.storageLocation,
				notes: input.notes,
				createdById: context.user.id,
				items: {
					create: input.items.map((item) => ({
						poItemId: item.poItemId,
						name: item.name,
						unit: item.unit,
						orderedQuantity: item.orderedQuantity,
						receivedQuantity: item.receivedQuantity,
					})),
				},
			},
			include: { items: true },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "GR_CREATED",
			entityType: "GoodsReceipt",
			entityId: gr.id,
			metadata: { grNumber, poNumber: po.poNumber },
		});

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
