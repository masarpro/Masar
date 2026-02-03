import { ORPCError } from "@orpc/server";
import {
	submitChangeOrder,
	approveChangeOrder,
	rejectChangeOrder,
	markImplemented,
	getChangeOrder,
	createNotification,
	logAuditEvent,
	db,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

/**
 * Submit a change order for approval (DRAFT -> SUBMITTED)
 */
export const submitChangeOrderProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/submit",
		tags: ["Project Change Orders"],
		summary: "Submit a change order for approval",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			changeOrderId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const changeOrder = await submitChangeOrder(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
				context.user.id,
			);

			// Log audit event
			await logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "CO_SUBMITTED",
				entityType: "change_order",
				entityId: changeOrder.id,
				metadata: {
					coNo: changeOrder.coNo,
					title: changeOrder.title,
				},
			});

			// Notify org admins/managers about new submission
			const admins = await db.member.findMany({
				where: {
					organizationId: input.organizationId,
					role: { in: ["owner", "admin"] },
				},
				select: { userId: true },
			});

			for (const admin of admins) {
				if (admin.userId !== context.user.id) {
					await createNotification(input.organizationId, admin.userId, {
						type: "APPROVAL_REQUESTED",
						title: "طلب اعتماد أمر تغيير",
						body: `تم تقديم أمر تغيير جديد: ${changeOrder.title}`,
						projectId: input.projectId,
						entityType: "change_order",
						entityId: changeOrder.id,
					});
				}
			}

			return changeOrder;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Change order not found") {
					throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
				}
				if (error.message === "Can only submit change orders in DRAFT status") {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن تقديم أوامر التغيير في حالة المسودة فقط",
					});
				}
			}
			throw error;
		}
	});

/**
 * Approve a change order (SUBMITTED -> APPROVED)
 */
export const approveChangeOrderProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/approve",
		tags: ["Project Change Orders"],
		summary: "Approve a change order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			changeOrderId: z.string(),
			decisionNote: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		// Get change order first for notification
		const existing = await getChangeOrder(
			input.organizationId,
			input.projectId,
			input.changeOrderId,
		);

		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
		}

		try {
			const changeOrder = await approveChangeOrder(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
				context.user.id,
				input.decisionNote,
			);

			// Log audit event
			await logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "CO_APPROVED",
				entityType: "change_order",
				entityId: changeOrder.id,
				metadata: {
					coNo: changeOrder.coNo,
					title: changeOrder.title,
					decisionNote: input.decisionNote,
				},
			});

			// Notify the requester
			await createNotification(input.organizationId, existing.requestedById, {
				type: "APPROVAL_DECIDED",
				title: "تم اعتماد أمر التغيير",
				body: `تم اعتماد أمر التغيير: ${changeOrder.title}`,
				projectId: input.projectId,
				entityType: "change_order",
				entityId: changeOrder.id,
			});

			return changeOrder;
		} catch (error) {
			if (error instanceof Error) {
				if (
					error.message === "Can only approve change orders in SUBMITTED status"
				) {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن اعتماد أوامر التغيير المقدمة فقط",
					});
				}
			}
			throw error;
		}
	});

/**
 * Reject a change order (SUBMITTED -> REJECTED)
 */
export const rejectChangeOrderProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/reject",
		tags: ["Project Change Orders"],
		summary: "Reject a change order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			changeOrderId: z.string(),
			decisionNote: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		// Get change order first for notification
		const existing = await getChangeOrder(
			input.organizationId,
			input.projectId,
			input.changeOrderId,
		);

		if (!existing) {
			throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
		}

		try {
			const changeOrder = await rejectChangeOrder(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
				context.user.id,
				input.decisionNote,
			);

			// Log audit event
			await logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "CO_REJECTED",
				entityType: "change_order",
				entityId: changeOrder.id,
				metadata: {
					coNo: changeOrder.coNo,
					title: changeOrder.title,
					decisionNote: input.decisionNote,
				},
			});

			// Notify the requester
			await createNotification(input.organizationId, existing.requestedById, {
				type: "APPROVAL_DECIDED",
				title: "تم رفض أمر التغيير",
				body: `تم رفض أمر التغيير: ${changeOrder.title}`,
				projectId: input.projectId,
				entityType: "change_order",
				entityId: changeOrder.id,
			});

			return changeOrder;
		} catch (error) {
			if (error instanceof Error) {
				if (
					error.message === "Can only reject change orders in SUBMITTED status"
				) {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن رفض أوامر التغيير المقدمة فقط",
					});
				}
			}
			throw error;
		}
	});

/**
 * Mark a change order as implemented (APPROVED -> IMPLEMENTED)
 */
export const markImplementedProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/implement",
		tags: ["Project Change Orders"],
		summary: "Mark a change order as implemented",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			changeOrderId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const changeOrder = await markImplemented(
				input.organizationId,
				input.projectId,
				input.changeOrderId,
				context.user.id,
			);

			// Log audit event
			await logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "CO_IMPLEMENTED",
				entityType: "change_order",
				entityId: changeOrder.id,
				metadata: {
					coNo: changeOrder.coNo,
					title: changeOrder.title,
					costImpact: changeOrder.costImpact?.toString(),
					timeImpactDays: changeOrder.timeImpactDays,
				},
			});

			return changeOrder;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Change order not found") {
					throw new ORPCError("NOT_FOUND", { message: "أمر التغيير غير موجود" });
				}
				if (
					error.message ===
					"Can only mark as implemented change orders in APPROVED status"
				) {
					throw new ORPCError("BAD_REQUEST", {
						message: "يمكن تنفيذ أوامر التغيير المعتمدة فقط",
					});
				}
			}
			throw error;
		}
	});
