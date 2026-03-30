import { ORPCError } from "@orpc/server";
import {
	actOnApproval,
	createNotification,
	logAuditEvent,
	getApproval,
} from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const actOnApprovalProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/approvals/{approvalId}/act",
		tags: ["Project Documents"],
		summary: "Approve or reject an approval request",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			approvalId: z.string().trim().max(100),
			decision: z.enum(["APPROVED", "REJECTED"]),
			note: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "reports", action: "approve" },
		);

		// Get approval and verify user is an approver
		const approval = await getApproval(
			input.organizationId,
			input.projectId,
			input.approvalId,
		);

		if (!approval) {
			throw new ORPCError("NOT_FOUND", { message: "طلب الاعتماد غير موجود" });
		}

		if (approval.status !== "PENDING") {
			throw new ORPCError("BAD_REQUEST", {
				message: "تم اتخاذ قرار على هذا الطلب مسبقاً",
			});
		}

		// Check if user is an approver
		const isApprover = approval.approvers.some(
			(a) => a.userId === context.user.id && a.status === "PENDING",
		);

		if (!isApprover) {
			throw new ORPCError("FORBIDDEN", {
				message: "ليس لديك صلاحية اتخاذ قرار على هذا الطلب",
			});
		}

		// Act on approval
		const updatedApproval = await actOnApproval(
			input.organizationId,
			input.projectId,
			input.approvalId,
			{
				actorId: context.user.id,
				decision: input.decision,
				note: input.note,
			},
		);

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "APPROVAL_DECIDED",
			entityType: "approval",
			entityId: input.approvalId,
			metadata: {
				decision: input.decision,
				documentId: approval.documentId,
				documentTitle: approval.document.title,
				note: input.note,
			},
		});

		// Notify the requester about the decision
		const decisionText = input.decision === "APPROVED" ? "اعتماد" : "رفض";
		await createNotification(input.organizationId, approval.requestedById, {
			type: "APPROVAL_DECIDED",
			title: `قرار اعتماد: ${decisionText}`,
			body: `تم ${decisionText} طلب الاعتماد على وثيقة: ${approval.document.title}`,
			projectId: input.projectId,
			entityType: "approval",
			entityId: input.approvalId,
		});

		return updatedApproval;
	});
