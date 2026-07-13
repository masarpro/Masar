import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc/procedures";
import { verifyOrganizationMembership } from "../organizations/lib/membership";
import {
	getCachedUserProjectScope,
	verifyOrganizationAccess,
} from "../../lib/permissions";
import { normalizePhotoRecord } from "../../lib/media/photo-url";
import {
	getActiveProjectsForDashboard,
	getDashboardStats,
	getProjectStatusDistribution,
	getProjectTypeDistribution,
	getFinancialSummaryByProject,
	getProjectsForUser,
	getUpcomingMilestones,
	getOverdueMilestones,
	getRecentActivities,
	getMonthlyFinancialTrend,
	getDashboardOverdueInvoices,
	getLeadsPipeline,
	getPendingSubcontractClaimsCount,
	getInvoiceTotals,
	getFieldActivitySummary,
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
		}

		return getMonthlyFinancialTrend(input.organizationId);
	});

/**
 * Enriched active-project cards for the dashboard: progress, مدفوعات/مقبوضات,
 * current milestone + days, and latest photos. Respects per-member project
 * visibility exactly like projects.list.
 */
const activeProjects = protectedProcedure
	.input(
		organizationInput.extend({
			limit: z.number().min(1).max(12).optional().default(4),
		}),
	)
	.handler(async ({ input, context }) => {
		const [, scope] = await Promise.all([
			verifyOrganizationAccess(input.organizationId, context.user.id, {
				section: "projects",
				action: "view",
			}),
			getCachedUserProjectScope(context.user.id, input.organizationId),
		]);

		let restrictToProjectIds: string[] | undefined;
		if (!scope.allProjects) {
			const assigned = await getProjectsForUser(
				context.user.id,
				input.organizationId,
			);
			restrictToProjectIds = assigned.map((p) => p.id);
		}

		const projects = await getActiveProjectsForDashboard(input.organizationId, {
			limit: input.limit,
			restrictToProjectIds,
		});

		return {
			projects: projects.map((p) => ({
				...p,
				coverPhoto: normalizePhotoRecord(p.coverPhoto),
				photos: p.photos
					.map((ph) => normalizePhotoRecord(ph))
					.filter((ph): ph is { url: string } => ph !== null),
			})),
		};
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
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
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
			fieldActivity,
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
			getFieldActivitySummary(input.organizationId),
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
			fieldActivity,
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
	activeProjects,
	getAll,
};
