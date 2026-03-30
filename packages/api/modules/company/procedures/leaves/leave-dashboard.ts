import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../../lib/permissions";
import { protectedProcedure } from "../../../../orpc/procedures";
import { idString } from "../../../../lib/validation-constants";

// ═══════════════════════════════════════════════════════════════════════════
// LEAVE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export const leaveDashboardProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/leaves/dashboard",
		tags: ["Company", "Leaves"],
		summary: "Leave management dashboard summary",
	})
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "employees",
			action: "view",
		});

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const [onLeaveToday, pendingRequests, lowBalances, recentRequests] = await Promise.all([
			// Who's on leave today
			db.leaveRequest.findMany({
				where: {
					organizationId: input.organizationId,
					status: "APPROVED",
					startDate: { lte: tomorrow },
					endDate: { gte: today },
				},
				include: {
					employee: { select: { id: true, name: true, employeeNo: true } },
					leaveType: { select: { id: true, name: true, nameEn: true, color: true } },
				},
				orderBy: { endDate: "asc" },
			}),

			// Pending requests count
			db.leaveRequest.count({
				where: {
					organizationId: input.organizationId,
					status: "PENDING",
				},
			}),

			// Low balances (remaining <= 3 days for current year)
			db.leaveBalance.findMany({
				where: {
					employee: { organizationId: input.organizationId, status: "ACTIVE" },
					year: today.getFullYear(),
					remainingDays: { lte: 3 },
					totalDays: { gt: 0 },
				},
				include: {
					employee: { select: { id: true, name: true } },
					leaveType: { select: { id: true, name: true, nameEn: true } },
				},
				orderBy: { remainingDays: "asc" },
				take: 10,
			}),

			// Recent requests
			db.leaveRequest.findMany({
				where: { organizationId: input.organizationId },
				include: {
					employee: { select: { id: true, name: true } },
					leaveType: { select: { id: true, name: true, nameEn: true, color: true } },
				},
				orderBy: { createdAt: "desc" },
				take: 5,
			}),
		]);

		return {
			onLeaveToday,
			pendingRequests,
			lowBalances,
			recentRequests,
		};
	});
