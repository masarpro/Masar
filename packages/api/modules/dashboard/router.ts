import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc/procedures";
import { verifyOrganizationMembership } from "../organizations/lib/membership";
import {
	getCachedUserPermissions,
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
	getPendingSubcontractClaimsCount,
	getInvoiceTotals,
	getFieldActivitySummary,
	getHeroCardMetrics,
	getUserDashboardPreference,
	upsertUserDashboardPreference,
} from "@repo/database";

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Router - Phase 12
// ═══════════════════════════════════════════════════════════════════════════

const organizationInput = z.object({
	organizationId: z.string(),
});

/**
 * Zero out the financial blocks of getDashboardStats for members without
 * finance.view — same server-side stripping policy as getAll's heroMetrics.
 * Shape is preserved (zeros, not nulls) so existing consumers don't break.
 */
function stripStatsFinancials(
	stats: Awaited<ReturnType<typeof getDashboardStats>>,
	canViewFinance: boolean,
) {
	if (canViewFinance) return stats;
	return {
		...stats,
		financials: {
			totalContractValue: 0,
			totalExpenses: 0,
			totalPaidClaims: 0,
			pendingClaimsValue: 0,
		},
		changeOrders: {
			...stats.changeOrders,
			totalCostImpact: 0,
		},
	};
}

/**
 * Get comprehensive dashboard statistics
 */
const getStats = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		const [membership, permissions] = await Promise.all([
			verifyOrganizationMembership(input.organizationId, context.user.id),
			getCachedUserPermissions(context.user.id, input.organizationId),
		]);
		if (!membership) {
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
		}

		const stats = await getDashboardStats(input.organizationId);
		return stripStatsFinancials(stats, permissions.finance?.view ?? false);
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
 * Get financial summary by project — per-project contract values, expenses
 * and paid claims, so it requires finance.view (not just membership).
 */
const getFinancialSummary = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

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
 * Get monthly financial trend for charts — cash-movement series off the
 * ledger accounts, so it requires finance.view (not just membership).
 */
const getFinancialTrend = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

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
		const [{ permissions }, scope] = await Promise.all([
			verifyOrganizationAccess(input.organizationId, context.user.id, {
				section: "projects",
				action: "view",
			}),
			getCachedUserProjectScope(context.user.id, input.organizationId),
		]);
		const canViewProjectFinance = permissions.projects?.viewFinance ?? false;

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
				// مدفوعات/مقبوضات المشروع بيانات مالية — تُحجب لمن لا يملك viewFinance
				expensesTotal: canViewProjectFinance ? p.expensesTotal : 0,
				paymentsTotal: canViewProjectFinance ? p.paymentsTotal : 0,
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
		const [membership, permissions] = await Promise.all([
			verifyOrganizationMembership(input.organizationId, context.user.id),
			getCachedUserPermissions(context.user.id, input.organizationId),
		]);
		if (!membership) {
			throw new ORPCError("FORBIDDEN", { message: "Unauthorized" });
		}

		// Hero-carousel gating (RBAC): financial cards need finance.view, the
		// projects-pulse card needs any projects permission — mirrors the
		// showFinance/showProjects gating the Dashboard client applies.
		const canViewFinance = permissions.finance?.view ?? false;
		const canViewProjects = Object.values(permissions.projects ?? {}).some(
			Boolean,
		);

		const [
			stats,
			upcoming,
			overdueMilestones,
			overdueInvoices,
			financialTrend,
			pendingSubcontractClaims,
			invoiceTotals,
			fieldActivity,
			heroCardMetrics,
		] = await Promise.all([
			getDashboardStats(input.organizationId),
			getUpcomingMilestones(input.organizationId, input.upcomingLimit),
			getOverdueMilestones(input.organizationId, 10),
			getDashboardOverdueInvoices(input.organizationId),
			getMonthlyFinancialTrend(input.organizationId),
			getPendingSubcontractClaimsCount(input.organizationId),
			getInvoiceTotals(input.organizationId),
			getFieldActivitySummary(input.organizationId),
			canViewFinance || canViewProjects
				? getHeroCardMetrics(input.organizationId)
				: Promise.resolve(null),
		]);

		// Never ship numbers the member has no permission to see — the finance
		// sections are stripped server-side, not just hidden in the UI.
		const heroMetrics = heroCardMetrics
			? {
					projectsPulse: canViewProjects
						? heroCardMetrics.projectsPulse
						: null,
					receivables: canViewFinance ? heroCardMetrics.receivables : null,
					zatca: canViewFinance ? heroCardMetrics.zatca : null,
				}
			: null;

		// Strip finance figures server-side for members without finance.view —
		// hiding them only in the UI still ships the numbers in the payload
		// (visible in DevTools). Mirrors the heroMetrics stripping above.
		return {
			stats: stripStatsFinancials(stats, canViewFinance),
			upcoming,
			overdue: {
				milestones: overdueMilestones,
				invoices: canViewFinance ? overdueInvoices : [],
			},
			financialTrend: canViewFinance ? financialTrend : null,
			pendingSubcontractClaims: canViewFinance ? pendingSubcontractClaims : null,
			invoiceTotals: canViewFinance ? invoiceTotals : null,
			fieldActivity,
			heroMetrics,
		};
	});

// مفاتيح بطاقات الـ Hero Carousel — تُطابق القائمة في BotlyHero.tsx
const heroCardKeySchema = z.enum(["finance", "projects", "cashflow", "zatca"]);

/**
 * Get the caller's saved hero-card selection for this organization.
 * Personal UI preference — membership is the only requirement.
 */
const getHeroCardPreference = protectedProcedure
	.input(organizationInput)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const preference = await getUserDashboardPreference(
			context.user.id,
			input.organizationId,
		);
		return { heroCardKey: preference?.heroCardKey ?? null };
	});

/**
 * Save the caller's hero-card selection (upsert, per user per organization).
 * protectedProcedure on purpose: this is a personal UI preference, not
 * organization data — FREE-plan members must be able to keep their choice.
 */
const setHeroCardPreference = protectedProcedure
	.input(
		organizationInput.extend({
			heroCardKey: heroCardKeySchema,
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id);

		const preference = await upsertUserDashboardPreference(
			context.user.id,
			input.organizationId,
			input.heroCardKey,
		);
		return { heroCardKey: preference.heroCardKey };
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
	getHeroCardPreference,
	setHeroCardPreference,
};
