import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prReject = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-requests/{requestId}/reject",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Reject a purchase request",
	})
	.input(
		z.object({
			organizationId: z.string(),
			requestId: z.string(),
			rejectionReason: z.string().min(1, "سبب الرفض مطلوب"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "approve",
		});

		const existing = await db.purchaseRequest.findFirst({
			where: { id: input.requestId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب الشراء غير موجود",
			});
		}
		if (existing.status !== "PR_PENDING" && existing.status !== "PR_DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن رفض هذا الطلب في حالته الحالية",
			});
		}

		const pr = await db.purchaseRequest.update({
			where: { id: input.requestId },
			data: {
				status: "PR_REJECTED",
				approvedById: context.user.id,
				approvalDate: new Date(),
				rejectionReason: input.rejectionReason,
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PR_REJECTED",
			entityType: "PurchaseRequest",
			entityId: pr.id,
			metadata: {
				prNumber: pr.prNumber,
				reason: input.rejectionReason,
			},
		});

		return { ...pr, estimatedTotal: Number(pr.estimatedTotal) };
	});
