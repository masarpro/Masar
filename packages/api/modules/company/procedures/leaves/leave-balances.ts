import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import {
	protectedProcedure,
	subscriptionProcedure,
} from "../../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════════════════
// LIST LEAVE BALANCES
// ═══════════════════════════════════════════════════════════════════════════
export const listLeaveBalancesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/leaves/balances",
		tags: ["Company", "Leaves"],
		summary: "List leave balances for employees",
	})
	.input(
		z.object({
			organizationId: z.string(),
			employeeId: z.string().optional(),
			year: z.number().int().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		const year = input.year ?? new Date().getFullYear();

		const where: Record<string, unknown> = {
			year,
			employee: { organizationId: input.organizationId },
		};

		if (input.employeeId) {
			where.employeeId = input.employeeId;
		}

		const balances = await db.leaveBalance.findMany({
			where,
			include: {
				employee: { select: { id: true, name: true, employeeNo: true } },
				leaveType: { select: { id: true, name: true, nameEn: true, color: true } },
			},
			orderBy: [{ employee: { name: "asc" } }, { leaveType: { name: "asc" } }],
		});

		return { balances, year };
	});

// ═══════════════════════════════════════════════════════════════════════════
// ADJUST LEAVE BALANCE
// ═══════════════════════════════════════════════════════════════════════════
export const adjustLeaveBalanceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/leaves/balances/adjust",
		tags: ["Company", "Leaves"],
		summary: "Adjust leave balance for an employee",
	})
	.input(
		z.object({
			organizationId: z.string(),
			employeeId: z.string(),
			leaveTypeId: z.string(),
			year: z.number().int().optional(),
			totalDays: z.number().int().min(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "edit",
		});

		const year = input.year ?? new Date().getFullYear();

		// Count used days from approved requests
		const usedResult = await db.leaveRequest.aggregate({
			where: {
				employeeId: input.employeeId,
				leaveTypeId: input.leaveTypeId,
				organizationId: input.organizationId,
				status: "APPROVED",
				startDate: {
					gte: new Date(`${year}-01-01`),
				},
				endDate: {
					lte: new Date(`${year}-12-31`),
				},
			},
			_sum: { totalDays: true },
		});

		const usedDays = usedResult._sum.totalDays ?? 0;
		const remainingDays = Math.max(0, input.totalDays - usedDays);

		return db.leaveBalance.upsert({
			where: {
				employeeId_leaveTypeId_year: {
					employeeId: input.employeeId,
					leaveTypeId: input.leaveTypeId,
					year,
				},
			},
			update: {
				totalDays: input.totalDays,
				usedDays,
				remainingDays,
			},
			create: {
				employeeId: input.employeeId,
				leaveTypeId: input.leaveTypeId,
				year,
				totalDays: input.totalDays,
				usedDays,
				remainingDays,
			},
			include: {
				employee: { select: { id: true, name: true } },
				leaveType: { select: { id: true, name: true } },
			},
		});
	});
