import { z } from "zod";
import { protectedProcedure } from "../../orpc/procedures";
import { verifyOrganizationMembership } from "../organizations/lib/membership";
import {
	getDashboardStats,
	getProjectStatusDistribution,
	getProjectTypeDistribution,
	getFinancialSummaryByProject,
	getUpcomingMilestones,
	getOverdueMilestones,
	getRecentActivities,
	getMonthlyFinancialTrend,
	getDashboardOverdueInvoices,
	getLeadsPipeline,
	getPendingSubcontractClaimsCount,
	getInvoiceTotals,
} from "@repo/database";

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Router - Phase 12
// ═══════════════════════════════════════════════════════════════════════════

const organizationInput = z.object({
	organizationId: z.string(),
});

/**
 * Get comprehensive dashboard statistics
 */
const getStats = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getDashboardStats(input.organizationId);
	});

/**
 * Get project status distribution for pie/donut chart
 */
const getProjectDistribution = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getProjectStatusDistribution(input.organizationId);
	});

/**
 * Get project type distribution for charts
 */
const getTypeDistribution = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getProjectTypeDistribution(input.organizationId);
	});

/**
 * Get financial summary by project
 */
const getFinancialSummary = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getFinancialSummaryByProject(input.organizationId);
	});

/**
 * Get upcoming milestones
 */
const getUpcoming = protectedProcedure
	.input(
		organizationInput.extend({
			limit: z.number().min(1).max(50).optional().default(10),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getUpcomingMilestones(input.organizationId, input.limit);
	});

/**
 * Get overdue milestones
 */
const getOverdue = protectedProcedure
	.input(
		organizationInput.extend({
			limit: z.number().min(1).max(50).optional().default(10),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getOverdueMilestones(input.organizationId, input.limit);
	});

/**
 * Get recent activities feed
 */
const getActivities = protectedProcedure
	.input(
		organizationInput.extend({
			limit: z.number().min(1).max(50).optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getRecentActivities(input.organizationId, input.limit);
	});

/**
 * Get monthly financial trend for charts
 */
const getFinancialTrend = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		return getMonthlyFinancialTrend(input.organizationId);
	});

/**
 * Combined dashboard endpoint — single auth check, all queries in parallel
 */
const getAll = protectedProcedure
	.input(
		organizationInput.extend({
			activitiesLimit: z.number().min(1).max(50).optional().default(5),
			upcomingLimit: z.number().min(1).max(50).optional().default(5),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new Error("Unauthorized");
		}

		const [
			stats,
			activities,
			upcoming,
			overdueMilestones,
			overdueInvoices,
			financialTrend,
			typeDistribution,
			leadsPipeline,
			pendingSubcontractClaims,
			invoiceTotals,
		] = await Promise.all([
			getDashboardStats(input.organizationId),
			getRecentActivities(input.organizationId, input.activitiesLimit),
			getUpcomingMilestones(input.organizationId, input.upcomingLimit),
			getOverdueMilestones(input.organizationId, 10),
			getDashboardOverdueInvoices(input.organizationId),
			getMonthlyFinancialTrend(input.organizationId),
			getProjectTypeDistribution(input.organizationId),
			getLeadsPipeline(input.organizationId),
			getPendingSubcontractClaimsCount(input.organizationId),
			getInvoiceTotals(input.organizationId),
		]);

		// Computed fields
		const netProfit = invoiceTotals.totalCollected - stats.financials.totalExpenses;
		const profitMargin = invoiceTotals.totalCollected > 0
			? Number(((netProfit / invoiceTotals.totalCollected) * 100).toFixed(1))
			: 0;

		return {
			stats,
			activities,
			upcoming,
			overdue: {
				milestones: overdueMilestones,
				invoices: overdueInvoices,
			},
			financialTrend,
			typeDistribution,
			leadsPipeline,
			pendingSubcontractClaims,
			invoiceTotals,
			netProfit,
			profitMargin,
		};
	});

export const dashboardRouter = {
	getStats,
	getProjectDistribution,
	getTypeDistribution,
	getFinancialSummary,
	getUpcoming,
	getOverdue,
	getActivities,
	getFinancialTrend,
	getAll,
};
