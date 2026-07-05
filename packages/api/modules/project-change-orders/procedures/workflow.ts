import { ORPCError } from "@orpc/server";
import {
	submitChangeOrder,
	approveChangeOrder,
	rejectChangeOrder,
	markImplemented,
	getChangeOrder,
	getProjectById,
	logAuditEvent,
} from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

/**
 * Submit a change order for approval (DRAFT -> SUBMITTED)
 */
export const submitChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/submit",
		tags: ["Project Change Orders"],
		summary: "Submit a change order for approval",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
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

			// إشعار مسؤولي المنظمة بالتقديم (الجمهور يُحل من السجل)
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.changeOrderSubmitted",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "changeOrder", id: changeOrder.id },
				data: {
					projectName: project?.name,
					coNo: changeOrder.coNo,
				},
			});

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
export const approveChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/approve",
		tags: ["Project Change Orders"],
		summary: "Approve a change order",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
			decisionNote: z.string().trim().max(100).optional(),
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

			// إشعار صاحب الطلب بالقرار
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.changeOrderDecided",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "changeOrder", id: changeOrder.id },
				recipients: [existing.requestedById],
				data: {
					projectName: project?.name,
					coNo: changeOrder.coNo,
					decision: "تمت الموافقة على",
				},
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
export const rejectChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/reject",
		tags: ["Project Change Orders"],
		summary: "Reject a change order",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
			decisionNote: z.string().trim().max(100).optional(),
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

			// إشعار صاحب الطلب بالقرار
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.changeOrderDecided",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "changeOrder", id: changeOrder.id },
				recipients: [existing.requestedById],
				data: {
					projectName: project?.name,
					coNo: changeOrder.coNo,
					decision: "تم رفض",
				},
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
export const markImplementedProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-change-orders/{changeOrderId}/implement",
		tags: ["Project Change Orders"],
		summary: "Mark a change order as implemented",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			changeOrderId: z.string().trim().max(100),
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

			// إشعار مديري المشروع + مسؤولي المنظمة بالتنفيذ
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.changeOrderImplemented",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "changeOrder", id: changeOrder.id },
				data: {
					projectName: project?.name,
					coNo: changeOrder.coNo,
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
