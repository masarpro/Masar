import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../../orpc/procedures";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	paginationLimit,
	paginationOffset,
	MAX_DESC,
	MAX_CODE,
} from "../../../../lib/validation-constants";
import { notifyEvent } from "../../../notifications/lib/notify";

// ═══════════════════════════════════════════════════════════════════════════
// LIST LEAVE REQUESTS
// ═══════════════════════════════════════════════════════════════════════════
export const listLeaveRequestsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/leaves/requests",
		tags: ["Company", "Leaves"],
		summary: "List leave requests with filters",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
			employeeId: idString().optional(),
			startDate: z.string().trim().max(MAX_CODE).optional(),
			endDate: z.string().trim().max(MAX_CODE).optional(),
			limit: paginationLimit().default(20),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		const where: Record<string, unknown> = {
			organizationId: input.organizationId,
		};

		if (input.status) where.status = input.status;
		if (input.employeeId) where.employeeId = input.employeeId;
		if (input.startDate || input.endDate) {
			where.startDate = {};
			if (input.startDate)
				(where.startDate as Record<string, unknown>).gte = new Date(input.startDate);
			if (input.endDate)
				(where.startDate as Record<string, unknown>).lte = new Date(input.endDate);
		}

		const [requests, total] = await Promise.all([
			db.leaveRequest.findMany({
				where,
				include: {
					employee: { select: { id: true, name: true, employeeNo: true } },
					leaveType: { select: { id: true, name: true, nameEn: true, color: true } },
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
			db.leaveRequest.count({ where }),
		]);

		return { requests, total };
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE LEAVE REQUEST
// ═══════════════════════════════════════════════════════════════════════════
export const createLeaveRequestProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/requests",
		tags: ["Company", "Leaves"],
		summary: "Create a leave request",
	})
	.input(
		z.object({
			organizationId: idString(),
			employeeId: idString(),
			leaveTypeId: idString(),
			startDate: z.string().trim().max(MAX_CODE),
			endDate: z.string().trim().max(MAX_CODE),
			reason: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		// Verify employee belongs to org
		const employee = await db.employee.findFirst({
			where: { id: input.employeeId, organizationId: input.organizationId },
		});
		if (!employee) {
			throw new ORPCError("NOT_FOUND", { message: "الموظف غير موجود" });
		}

		// Verify leave type
		const leaveType = await db.leaveType.findFirst({
			where: { id: input.leaveTypeId, organizationId: input.organizationId },
		});
		if (!leaveType) {
			throw new ORPCError("NOT_FOUND", { message: "نوع الإجازة غير موجود" });
		}

		const start = new Date(input.startDate);
		const end = new Date(input.endDate);

		if (end < start) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
			});
		}

		// Calculate total days (simple: end - start + 1)
		const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		// Check balance
		const year = start.getFullYear();
		const balance = await db.leaveBalance.findUnique({
			where: {
				employeeId_leaveTypeId_year: {
					employeeId: input.employeeId,
					leaveTypeId: input.leaveTypeId,
					year,
				},
			},
		});

		if (balance && balance.remainingDays < totalDays && leaveType.daysPerYear > 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: `الرصيد المتبقي (${balance.remainingDays} يوم) لا يكفي لـ ${totalDays} يوم`,
			});
		}

		// Check for overlapping requests
		const overlapping = await db.leaveRequest.findFirst({
			where: {
				employeeId: input.employeeId,
				organizationId: input.organizationId,
				status: { in: ["PENDING", "APPROVED"] },
				OR: [
					{ startDate: { lte: end }, endDate: { gte: start } },
				],
			},
		});

		if (overlapping) {
			throw new ORPCError("BAD_REQUEST", {
				message: "يوجد طلب إجازة متداخل مع هذه الفترة",
			});
		}

		const created = await db.leaveRequest.create({
			data: {
				organizationId: input.organizationId,
				employeeId: input.employeeId,
				leaveTypeId: input.leaveTypeId,
				startDate: start,
				endDate: end,
				totalDays,
				reason: input.reason,
				status: leaveType.requiresApproval ? "PENDING" : "APPROVED",
			},
			include: {
				employee: { select: { id: true, name: true } },
				leaveType: { select: { id: true, name: true } },
			},
		});

		await notifyEvent({
			event: "hr.leaveRequestSubmitted",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "leaveRequest", id: created.id },
			data: {
				employeeName: employee.name,
				leaveType: leaveType.name,
				startDate: start.toLocaleDateString("ar-SA"),
				endDate: end.toLocaleDateString("ar-SA"),
			},
		});

		return created;
	});

// ═══════════════════════════════════════════════════════════════════════════
// APPROVE LEAVE REQUEST
// ═══════════════════════════════════════════════════════════════════════════
export const approveLeaveRequestProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/requests/{id}/approve",
		tags: ["Company", "Leaves"],
		summary: "Approve a leave request",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const request = await db.leaveRequest.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});

		if (!request) {
			throw new ORPCError("NOT_FOUND", { message: "طلب الإجازة غير موجود" });
		}

		if (request.status !== "PENDING") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن اعتماد طلب غير معلّق",
			});
		}

		// Update request and balance in transaction
		const approvedRequest = await db.$transaction(async (tx) => {
			// Optimistic guard: flip PENDING→APPROVED only if still PENDING, so two
			// concurrent approvals can't both pass the pre-tx check and deduct the
			// leave balance twice. count === 0 → someone else already processed it.
			const claimed = await tx.leaveRequest.updateMany({
				where: { id: input.id, status: "PENDING" },
				data: {
					status: "APPROVED",
					approvedBy: context.user.id,
					approvedAt: new Date(),
				},
			});
			if (claimed.count === 0) {
				throw new ORPCError("CONFLICT", {
					message: "تمت معالجة الطلب بالفعل",
				});
			}
			const updated = await tx.leaveRequest.findUniqueOrThrow({
				where: { id: input.id },
				include: {
					employee: { select: { id: true, name: true } },
					leaveType: { select: { id: true, name: true } },
				},
			});

			// Update balance
			const year = request.startDate.getFullYear();
			await tx.leaveBalance.upsert({
				where: {
					employeeId_leaveTypeId_year: {
						employeeId: request.employeeId,
						leaveTypeId: request.leaveTypeId,
						year,
					},
				},
				update: {
					usedDays: { increment: request.totalDays },
					remainingDays: { decrement: request.totalDays },
				},
				create: {
					employeeId: request.employeeId,
					leaveTypeId: request.leaveTypeId,
					year,
					totalDays: 0,
					usedDays: request.totalDays,
					remainingDays: 0,
				},
			});

			return updated;
		});

		const approvedEmployee = await db.employee.findUnique({
			where: { id: request.employeeId },
			select: { linkedUserId: true },
		});
		await notifyEvent({
			event: "hr.leaveRequestDecided",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "leaveRequest", id: input.id },
			recipients: approvedEmployee?.linkedUserId
				? [approvedEmployee.linkedUserId]
				: [],
			data: {
				decision: "تمت الموافقة على",
				startDate: request.startDate.toLocaleDateString("ar-SA"),
				endDate: request.endDate.toLocaleDateString("ar-SA"),
			},
		});

		return approvedRequest;
	});

// ═══════════════════════════════════════════════════════════════════════════
// REJECT LEAVE REQUEST
// ═══════════════════════════════════════════════════════════════════════════
export const rejectLeaveRequestProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/requests/{id}/reject",
		tags: ["Company", "Leaves"],
		summary: "Reject a leave request",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			rejectionReason: trimmedString(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const request = await db.leaveRequest.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});

		if (!request) {
			throw new ORPCError("NOT_FOUND", { message: "طلب الإجازة غير موجود" });
		}

		if (request.status !== "PENDING") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن رفض طلب غير معلّق",
			});
		}

		const rejectedRequest = await db.leaveRequest.update({
			where: { id: input.id },
			data: {
				status: "REJECTED",
				rejectionReason: input.rejectionReason,
				approvedBy: context.user.id,
				approvedAt: new Date(),
			},
			include: {
				employee: { select: { id: true, name: true } },
				leaveType: { select: { id: true, name: true } },
			},
		});

		const rejectedEmployee = await db.employee.findUnique({
			where: { id: request.employeeId },
			select: { linkedUserId: true },
		});
		await notifyEvent({
			event: "hr.leaveRequestDecided",
			organizationId: input.organizationId,
			actorId: context.user.id,
			entity: { type: "leaveRequest", id: input.id },
			recipients: rejectedEmployee?.linkedUserId
				? [rejectedEmployee.linkedUserId]
				: [],
			data: {
				decision: "تم رفض",
				startDate: request.startDate.toLocaleDateString("ar-SA"),
				endDate: request.endDate.toLocaleDateString("ar-SA"),
			},
		});

		return rejectedRequest;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL LEAVE REQUEST
// ═══════════════════════════════════════════════════════════════════════════
export const cancelLeaveRequestProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/requests/{id}/cancel",
		tags: ["Company", "Leaves"],
		summary: "Cancel a leave request",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const request = await db.leaveRequest.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
		});

		if (!request) {
			throw new ORPCError("NOT_FOUND", { message: "طلب الإجازة غير موجود" });
		}

		if (request.status === "CANCELLED") {
			throw new ORPCError("BAD_REQUEST", { message: "الطلب ملغي مسبقاً" });
		}

		return db.$transaction(async (tx) => {
			// Lock the row and re-read its status INSIDE the tx. Whether we restore
			// the leave balance must key off the status at cancel time, not the
			// stale pre-tx snapshot: a concurrent approve could deduct the balance
			// after our first read, and cancelling on the old "PENDING" snapshot
			// would then never restore it (permanently leaked days).
			await tx.$queryRawUnsafe(
				`SELECT id FROM leave_requests WHERE id = $1 FOR UPDATE`,
				input.id,
			);
			const fresh = await tx.leaveRequest.findUnique({
				where: { id: input.id },
				select: { status: true },
			});
			if (!fresh || fresh.status === "CANCELLED") {
				throw new ORPCError("BAD_REQUEST", { message: "الطلب ملغي مسبقاً" });
			}
			const wasApproved = fresh.status === "APPROVED";

			const updated = await tx.leaveRequest.update({
				where: { id: input.id },
				data: { status: "CANCELLED" },
				include: {
					employee: { select: { id: true, name: true } },
					leaveType: { select: { id: true, name: true } },
				},
			});

			// If it was approved (checked under the lock), restore balance
			if (wasApproved) {
				const year = request.startDate.getFullYear();
				await tx.leaveBalance.update({
					where: {
						employeeId_leaveTypeId_year: {
							employeeId: request.employeeId,
							leaveTypeId: request.leaveTypeId,
							year,
						},
					},
					data: {
						usedDays: { decrement: request.totalDays },
						remainingDays: { increment: request.totalDays },
					},
				});
			}

			return updated;
		});
	});
