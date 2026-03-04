import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poSend = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-orders/{orderId}/send",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Mark a purchase order as sent to vendor",
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
			action: "order",
		});

		const existing = await db.purchaseOrder.findFirst({
			where: { id: input.orderId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "أمر الشراء غير موجود",
			});
		}
		if (existing.status !== "PO_APPROVED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يجب اعتماد أمر الشراء قبل إرساله",
			});
		}

		const po = await db.purchaseOrder.update({
			where: { id: input.orderId },
			data: { status: "PO_SENT" },
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PO_SENT",
			entityType: "PurchaseOrder",
			entityId: po.id,
			metadata: { poNumber: po.poNumber },
		});

		return { ...po, totalAmount: Number(po.totalAmount) };
	});
