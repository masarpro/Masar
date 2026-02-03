import { ORPCError } from "@orpc/server";
import {
	createApprovalRequest,
	createNotifications,
	logAuditEvent,
	getDocument,
	db,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createApprovalRequestProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/{documentId}/approvals",
		tags: ["Project Documents"],
		summary: "Create an approval request for a document",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			documentId: z.string(),
			approverUserIds: z.array(z.string()).min(1, "يجب تحديد معتمد واحد على الأقل"),
			note: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "reports", action: "create" },
		);

		// Verify document exists and belongs to the project
		const document = await getDocument(
			input.organizationId,
			input.projectId,
			input.documentId,
		);

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "الوثيقة غير موجودة" });
		}

		// Check if there's already a pending approval
		const existingApproval = await db.projectApproval.findFirst({
			where: {
				documentId: input.documentId,
				status: "PENDING",
			},
		});

		if (existingApproval) {
			throw new ORPCError("BAD_REQUEST", {
				message: "يوجد طلب اعتماد قيد الانتظار لهذه الوثيقة",
			});
		}

		// Verify all approvers are members of the organization
		const validApprovers = await db.member.findMany({
			where: {
				organizationId: input.organizationId,
				userId: { in: input.approverUserIds },
			},
			select: { userId: true },
		});

		const validApproverIds = validApprovers.map((a) => a.userId);
		const invalidApprovers = input.approverUserIds.filter(
			(id) => !validApproverIds.includes(id),
		);

		if (invalidApprovers.length > 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "بعض المعتمدين ليسوا أعضاء في المنظمة",
			});
		}

		// Create approval request
		const approval = await createApprovalRequest(
			input.organizationId,
			input.projectId,
			{
				documentId: input.documentId,
				requestedById: context.user.id,
				approverUserIds: validApproverIds,
				note: input.note,
			},
		);

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "APPROVAL_REQUESTED",
			entityType: "approval",
			entityId: approval.id,
			metadata: {
				documentId: input.documentId,
				documentTitle: document.title,
				approvers: validApproverIds,
			},
		});

		// Create notifications for approvers
		await createNotifications(input.organizationId, validApproverIds, {
			type: "APPROVAL_REQUESTED",
			title: "طلب اعتماد جديد",
			body: `تم طلب اعتمادك على وثيقة: ${document.title}`,
			projectId: input.projectId,
			entityType: "approval",
			entityId: approval.id,
		});

		return approval;
	});
