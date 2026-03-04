import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const poCancel = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-orders/{orderId}/cancel",
		tags: ["Procurement", "Purchase Orders"],
		summary: "Cancel a purchase order",
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
		if (
			existing.status === "PO_FULLY_RECEIVED" ||
			existing.status === "PO_CLOSED" ||
			existing.status === "PO_CANCELLED"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن إلغاء أمر الشراء في حالته الحالية",
			});
		}

		const po = await db.purchaseOrder.update({
			where: { id: input.orderId },
			data: { status: "PO_CANCELLED" },
		});

		return { ...po, totalAmount: Number(po.totalAmount) };
	});
