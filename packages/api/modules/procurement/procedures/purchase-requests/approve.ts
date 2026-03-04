import { db, orgAuditLog } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prApprove = subscriptionProcedure
	.route({
		method: "POST",
		path: "/procurement/purchase-requests/{requestId}/approve",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Approve a purchase request",
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
				message: "لا يمكن اعتماد هذا الطلب في حالته الحالية",
			});
		}

		const pr = await db.purchaseRequest.update({
			where: { id: input.requestId },
			data: {
				status: "PR_APPROVED",
				approvedById: context.user.id,
				approvalDate: new Date(),
			},
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PR_APPROVED",
			entityType: "PurchaseRequest",
			entityId: pr.id,
			metadata: { prNumber: pr.prNumber },
		});

		return { ...pr, estimatedTotal: Number(pr.estimatedTotal) };
	});
