import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prCancel = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-requests/{requestId}/cancel",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Cancel a purchase request",
	})
	.input(
		z.object({
			organizationId: z.string(),
			requestId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "request",
		});

		const existing = await db.purchaseRequest.findFirst({
			where: { id: input.requestId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب الشراء غير موجود",
			});
		}
		if (
			existing.status === "FULLY_ORDERED" ||
			existing.status === "PR_CANCELLED"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن إلغاء هذا الطلب",
			});
		}

		const pr = await db.purchaseRequest.update({
			where: { id: input.requestId },
			data: { status: "PR_CANCELLED" },
		});

		return { ...pr, estimatedTotal: Number(pr.estimatedTotal) };
	});
