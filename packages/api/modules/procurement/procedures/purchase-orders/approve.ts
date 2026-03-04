import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poApprove = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-orders/{orderId}/approve",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Approve a purchase order",
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
			action: "approve",
		});

		const existing = await db.purchaseOrder.findFirst({
			where: { id: input.orderId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "أمر الشراء غير موجود",
			});
		}
		if (
			existing.status !== "PO_DRAFT" &&
			existing.status !== "PO_PENDING_APPROVAL"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن اعتماد أمر الشراء في حالته الحالية",
			});
		}

		const po = await db.purchaseOrder.update({
			where: { id: input.orderId },
			data: {
				status: "PO_APPROVED",
				approvedById: context.user.id,
				approvalDate: new Date(),
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PO_APPROVED",
			entityType: "PurchaseOrder",
			entityId: po.id,
			metadata: { poNumber: po.poNumber },
		});

		return { ...po, totalAmount: Number(po.totalAmount) };
	});
