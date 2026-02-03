import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Queries - استعلامات لوحة القيادة
// Phase 12: Comprehensive dashboard statistics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get organization-wide dashboard statistics
 */
export async function getDashboardStats(organizationId: string) {
	const [
		projectStats,
		financialStats,
		changeOrderStats,
		milestoneStats,
	] = await Promise.all([
		// Project counts by status
		db.project.groupBy({
			by: ["status"],
			where: { organizationId },
			_count: { id: true },
		}),
		// Financial aggregations
		Promise.all([
			db.project.aggregate({
				where: { organizationId },
				_sum: { contractValue: true },
			}),
			db.projectExpense.aggregate({
				where: { organizationId },
				_sum: { amount: true },
			}),
			db.projectClaim.aggregate({
				where: { organizationId, status: "PAID" },
				_sum: { amount: true },
			}),
			db.projectClaim.aggregate({
				where: { organizationId, status: "APPROVED" },
				_sum: { amount: true },
			}),
		]),
		// Change order stats
		db.projectChangeOrder.groupBy({
			by: ["status"],
			where: { organizationId },
			_count: { id: true },
			_sum: { costImpact: true, timeImpactDays: true },
		}),
		// Milestone stats
		Promise.all([
			db.projectMilestone.count({
				where: { organizationId, status: "COMPLETED" },
			}),
			db.projectMilestone.count({
				where: { organizationId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
			}),
			db.projectMilestone.count({
				where: {
					organizationId,
					status: { in: ["PLANNED", "IN_PROGRESS"] },
					plannedEnd: { lt: new Date() },
				},
			}),
		]),
	]);

	// Process project stats
	const projectCounts = {
		total: 0,
		active: 0,
		onHold: 0,
		completed: 0,
	};
	for (const stat of projectStats) {
		projectCounts.total += stat._count.id;
		if (stat.status === "ACTIVE") projectCounts.active = stat._count.id;
		if (stat.status === "ON_HOLD") projectCounts.onHold = stat._count.id;
		if (stat.status === "COMPLETED") projectCounts.completed = stat._count.id;
	}

	// Process financial stats
	const [contractValue, expenses, paidClaims, pendingClaims] = financialStats;
	const financials = {
		totalContractValue: contractValue._sum.contractValue
			? Number(contractValue._sum.contractValue)
			: 0,
		totalExpenses: expenses._sum.amount
			? Number(expenses._sum.amount)
			: 0,
		totalPaidClaims: paidClaims._sum.amount
			? Number(paidClaims._sum.amount)
			: 0,
		pendingClaimsValue: pendingClaims._sum.amount
			? Number(pendingClaims._sum.amount)
			: 0,
	};

	// Process change order stats
	const changeOrders = {
		total: 0,
		pending: 0,
		approved: 0,
		totalCostImpact: 0,
		totalTimeImpact: 0,
	};
	for (const stat of changeOrderStats) {
		changeOrders.total += stat._count.id;
		if (stat.status === "SUBMITTED") changeOrders.pending = stat._count.id;
		if (stat.status === "APPROVED" || stat.status === "IMPLEMENTED") {
			changeOrders.approved += stat._count.id;
			changeOrders.totalCostImpact += stat._sum.costImpact
				? Number(stat._sum.costImpact)
				: 0;
			changeOrders.totalTimeImpact += stat._sum.timeImpactDays ?? 0;
		}
	}

	// Process milestone stats
	const [completedMilestones, pendingMilestones, overdueMilestones] = milestoneStats;
	const milestones = {
		completed: completedMilestones,
		pending: pendingMilestones,
		overdue: overdueMilestones,
	};

	return {
		projects: projectCounts,
		financials,
		changeOrders,
		milestones,
	};
}

/**
 * Get project status distribution for charts
 */
export async function getProjectStatusDistribution(organizationId: string) {
	const distribution = await db.project.groupBy({
		by: ["status"],
		where: { organizationId },
		_count: { id: true },
	});

	return distribution.map((d) => ({
		status: d.status,
		count: d._count.id,
	}));
}

/**
 * Get project type distribution for charts
 */
export async function getProjectTypeDistribution(organizationId: string) {
	const distribution = await db.project.groupBy({
		by: ["type"],
		where: { organizationId },
		_count: { id: true },
	});

	return distribution.map((d) => ({
		type: d.type,
		count: d._count.id,
	}));
}

/**
 * Get financial summary by project
 */
export async function getFinancialSummaryByProject(organizationId: string) {
	const projects = await db.project.findMany({
		where: { organizationId, status: "ACTIVE" },
		select: {
			id: true,
			name: true,
			contractValue: true,
			progress: true,
			_count: {
				select: {
					expenses: true,
					claims: true,
				},
			},
		},
		orderBy: { contractValue: "desc" },
		take: 10,
	});

	// Get expenses and claims totals for each project
	const projectIds = projects.map((p) => p.id);

	const [expensesByProject, claimsByProject] = await Promise.all([
		db.projectExpense.groupBy({
			by: ["projectId"],
			where: { projectId: { in: projectIds } },
			_sum: { amount: true },
		}),
		db.projectClaim.groupBy({
			by: ["projectId"],
			where: { projectId: { in: projectIds }, status: "PAID" },
			_sum: { amount: true },
		}),
	]);

	const expensesMap = new Map(
		expensesByProject.map((e) => [e.projectId, Number(e._sum.amount ?? 0)])
	);
	const claimsMap = new Map(
		claimsByProject.map((c) => [c.projectId, Number(c._sum.amount ?? 0)])
	);

	return projects.map((p) => ({
		id: p.id,
		name: p.name,
		contractValue: p.contractValue ? Number(p.contractValue) : 0,
		progress: p.progress,
		totalExpenses: expensesMap.get(p.id) ?? 0,
		totalPaidClaims: claimsMap.get(p.id) ?? 0,
	}));
}

/**
 * Get upcoming milestones across all projects
 */
export async function getUpcomingMilestones(
	organizationId: string,
	limit = 10,
) {
	const milestones = await db.projectMilestone.findMany({
		where: {
			organizationId,
			status: { in: ["PLANNED", "IN_PROGRESS"] },
			plannedEnd: { gte: new Date() },
		},
		select: {
			id: true,
			title: true,
			plannedEnd: true,
			status: true,
			progress: true,
			project: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { plannedEnd: "asc" },
		take: limit,
	});

	return milestones;
}

/**
 * Get overdue milestones across all projects
 */
export async function getOverdueMilestones(
	organizationId: string,
	limit = 10,
) {
	const milestones = await db.projectMilestone.findMany({
		where: {
			organizationId,
			status: { in: ["PLANNED", "IN_PROGRESS"] },
			plannedEnd: { lt: new Date() },
		},
		select: {
			id: true,
			title: true,
			plannedEnd: true,
			status: true,
			progress: true,
			project: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { plannedEnd: "asc" },
		take: limit,
	});

	return milestones;
}

/**
 * Get recent activities across all projects
 */
export async function getRecentActivities(
	organizationId: string,
	limit = 20,
) {
	// Get various recent activities in parallel
	const [
		recentChangeOrders,
		recentClaims,
		recentIssues,
	] = await Promise.all([
		// Recent change orders
		db.projectChangeOrder.findMany({
			where: { organizationId },
			select: {
				id: true,
				coNo: true,
				title: true,
				status: true,
				createdAt: true,
				requestedBy: { select: { id: true, name: true } },
				project: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 7,
		}),
		// Recent claims
		db.projectClaim.findMany({
			where: { organizationId },
			select: {
				id: true,
				claimNo: true,
				amount: true,
				status: true,
				createdAt: true,
				createdBy: { select: { id: true, name: true } },
				project: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 7,
		}),
		// Recent issues
		db.projectIssue.findMany({
			where: { project: { organizationId } },
			select: {
				id: true,
				title: true,
				status: true,
				severity: true,
				createdAt: true,
				createdBy: { select: { id: true, name: true } },
				project: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 7,
		}),
	]);

	// Combine and sort by createdAt
	const activities: Array<{
		type: "change_order" | "claim" | "issue";
		id: string;
		title: string;
		createdAt: Date;
		createdBy: { id: string; name: string };
		project: { id: string; name: string };
		metadata?: Record<string, unknown>;
	}> = [];

	for (const co of recentChangeOrders) {
		activities.push({
			type: "change_order",
			id: co.id,
			title: `CO-${co.coNo}: ${co.title}`,
			createdAt: co.createdAt,
			createdBy: co.requestedBy,
			project: co.project,
			metadata: { status: co.status },
		});
	}

	for (const claim of recentClaims) {
		activities.push({
			type: "claim",
			id: claim.id,
			title: `مستخلص #${claim.claimNo}`,
			createdAt: claim.createdAt,
			createdBy: claim.createdBy,
			project: claim.project,
			metadata: { amount: Number(claim.amount), status: claim.status },
		});
	}

	for (const issue of recentIssues) {
		activities.push({
			type: "issue",
			id: issue.id,
			title: issue.title,
			createdAt: issue.createdAt,
			createdBy: issue.createdBy,
			project: issue.project,
			metadata: { status: issue.status, severity: issue.severity },
		});
	}

	// Sort by createdAt descending
	activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	return activities.slice(0, limit);
}

/**
 * Get monthly financial trend for charts (last 6 months)
 */
export async function getMonthlyFinancialTrend(organizationId: string) {
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const [expenses, claims] = await Promise.all([
		db.projectExpense.findMany({
			where: {
				organizationId,
				date: { gte: sixMonthsAgo },
			},
			select: {
				date: true,
				amount: true,
			},
		}),
		db.projectClaim.findMany({
			where: {
				organizationId,
				createdAt: { gte: sixMonthsAgo },
			},
			select: {
				createdAt: true,
				amount: true,
				status: true,
			},
		}),
	]);

	// Group by month
	const monthlyData = new Map<string, { expenses: number; claims: number }>();

	for (const expense of expenses) {
		const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, "0")}`;
		const current = monthlyData.get(monthKey) ?? { expenses: 0, claims: 0 };
		current.expenses += Number(expense.amount);
		monthlyData.set(monthKey, current);
	}

	for (const claim of claims) {
		if (claim.status === "PAID") {
			const monthKey = `${claim.createdAt.getFullYear()}-${String(claim.createdAt.getMonth() + 1).padStart(2, "0")}`;
			const current = monthlyData.get(monthKey) ?? { expenses: 0, claims: 0 };
			current.claims += Number(claim.amount);
			monthlyData.set(monthKey, current);
		}
	}

	// Convert to array and sort
	const result = Array.from(monthlyData.entries())
		.map(([month, data]) => ({
			month,
			expenses: data.expenses,
			claims: data.claims,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));

	return result;
}
