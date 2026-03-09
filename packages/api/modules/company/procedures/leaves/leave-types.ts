import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════════════════
// LIST LEAVE TYPES
// ═══════════════════════════════════════════════════════════════════════════
export const listLeaveTypesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/leaves/types",
		tags: ["Company", "Leaves"],
		summary: "List leave types",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		return db.leaveType.findMany({
			where: { organizationId: input.organizationId },
			orderBy: { createdAt: "asc" },
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE LEAVE TYPE
// ═══════════════════════════════════════════════════════════════════════════
export const createLeaveTypeProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/types",
		tags: ["Company", "Leaves"],
		summary: "Create a leave type",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1),
			nameEn: z.string().optional(),
			daysPerYear: z.number().int().min(0),
			isPaid: z.boolean().optional().default(true),
			requiresApproval: z.boolean().optional().default(true),
			color: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const existing = await db.leaveType.findFirst({
			where: {
				organizationId: input.organizationId,
				name: input.name,
			},
		});

		if (existing) {
			throw new ORPCError("BAD_REQUEST", {
				message: "نوع الإجازة موجود مسبقاً",
			});
		}

		return db.leaveType.create({
			data: {
				organizationId: input.organizationId,
				name: input.name,
				nameEn: input.nameEn,
				daysPerYear: input.daysPerYear,
				isPaid: input.isPaid,
				requiresApproval: input.requiresApproval,
				color: input.color,
			},
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE LEAVE TYPE
// ═══════════════════════════════════════════════════════════════════════════
export const updateLeaveTypeProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/leaves/types/{id}",
		tags: ["Company", "Leaves"],
		summary: "Update a leave type",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			nameEn: z.string().optional(),
			daysPerYear: z.number().int().min(0).optional(),
			isPaid: z.boolean().optional(),
			requiresApproval: z.boolean().optional(),
			color: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const { organizationId, id, ...data } = input;
		return db.leaveType.update({
			where: { id },
			data,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE LEAVE TYPE
// ═══════════════════════════════════════════════════════════════════════════
export const deleteLeaveTypeProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/company/leaves/types/{id}",
		tags: ["Company", "Leaves"],
		summary: "Delete a leave type",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "delete",
		});

		// Check for existing requests
		const requestCount = await db.leaveRequest.count({
			where: { leaveTypeId: input.id, organizationId: input.organizationId },
		});

		if (requestCount > 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن حذف نوع إجازة مرتبط بطلبات. يمكنك تعديل الاسم أو الأيام.",
			});
		}

		await db.leaveType.delete({ where: { id: input.id } });
		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// SEED DEFAULT SAUDI LEAVE TYPES
// ═══════════════════════════════════════════════════════════════════════════
export const seedDefaultLeaveTypesProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/types/seed-defaults",
		tags: ["Company", "Leaves"],
		summary: "Seed default Saudi leave types",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const defaults = [
			{ name: "إجازة سنوية", nameEn: "Annual Leave", daysPerYear: 21, isPaid: true, color: "#3b82f6" },
			{ name: "إجازة مرضية", nameEn: "Sick Leave", daysPerYear: 30, isPaid: true, color: "#ef4444" },
			{ name: "إجازة زواج", nameEn: "Marriage Leave", daysPerYear: 5, isPaid: true, color: "#ec4899" },
			{ name: "إجازة وفاة قريب", nameEn: "Bereavement Leave", daysPerYear: 5, isPaid: true, color: "#6b7280" },
			{ name: "إجازة أمومة", nameEn: "Maternity Leave", daysPerYear: 70, isPaid: true, color: "#f59e0b" },
			{ name: "إجازة أبوة", nameEn: "Paternity Leave", daysPerYear: 3, isPaid: true, color: "#8b5cf6" },
			{ name: "إجازة حج", nameEn: "Hajj Leave", daysPerYear: 10, isPaid: true, color: "#10b981" },
			{ name: "إجازة بدون راتب", nameEn: "Unpaid Leave", daysPerYear: 0, isPaid: false, color: "#94a3b8" },
		];

		let created = 0;
		for (const lt of defaults) {
			const existing = await db.leaveType.findFirst({
				where: { organizationId: input.organizationId, name: lt.name },
			});
			if (!existing) {
				await db.leaveType.create({
					data: { organizationId: input.organizationId, ...lt, requiresApproval: true },
				});
				created++;
			}
		}

		return { created };
	});
