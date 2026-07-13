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
		// Financial aggregations (PAID + APPROVED claims merged into one groupBy)
		Promise.all([
			db.project.aggregate({
				where: { organizationId },
				_sum: { contractValue: true },
			}),
			db.projectExpense.aggregate({
				where: { organizationId },
				_sum: { amount: true },
			}),
			db.projectClaim.groupBy({
				by: ["status"],
				where: { organizationId, status: { in: ["PAID", "APPROVED"] } },
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
		// Milestone stats: one groupBy covers completed + pending; overdue needs
		// its own count because of the plannedEnd predicate.
		Promise.all([
			db.projectMilestone.groupBy({
				by: ["status"],
				where: {
					organizationId,
					status: { in: ["COMPLETED", "PLANNED", "IN_PROGRESS"] },
				},
				_count: { id: true },
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
	const [contractValue, expenses, claimStats] = financialStats;
	const paidClaimsSum = claimStats.find((c) => c.status === "PAID")?._sum
		.amount;
	const pendingClaimsSum = claimStats.find((c) => c.status === "APPROVED")
		?._sum.amount;
	const financials = {
		totalContractValue: contractValue._sum.contractValue
			? Number(contractValue._sum.contractValue)
			: 0,
		totalExpenses: expenses._sum.amount
			? Number(expenses._sum.amount)
			: 0,
		totalPaidClaims: paidClaimsSum ? Number(paidClaimsSum) : 0,
		pendingClaimsValue: pendingClaimsSum ? Number(pendingClaimsSum) : 0,
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
	const [milestoneCounts, overdueMilestones] = milestoneStats;
	let completedMilestones = 0;
	let pendingMilestones = 0;
	for (const stat of milestoneCounts) {
		if (stat.status === "COMPLETED") {
			completedMilestones = stat._count.id;
		} else {
			// PLANNED + IN_PROGRESS
			pendingMilestones += stat._count.id;
		}
	}
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
		progress: Number(p.progress),
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
 * Get overdue invoices (past due date, not fully paid)
 */
export async function getDashboardOverdueInvoices(
	organizationId: string,
	limit = 10,
) {
	return db.financeInvoice.findMany({
		where: {
			organizationId,
			dueDate: { lt: new Date() },
			status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
		},
		select: {
			id: true,
			invoiceNo: true,
			clientName: true,
			totalAmount: true,
			paidAmount: true,
			dueDate: true,
			status: true,
		},
		orderBy: { dueDate: "asc" },
		take: limit,
	});
}

/**
 * Get leads pipeline (grouped by status)
 */
export async function getLeadsPipeline(organizationId: string) {
	const result = await db.lead.groupBy({
		by: ["status"],
		where: { organizationId },
		_count: { id: true },
	});

	const pipeline: Record<string, number> = {};
	for (const row of result) {
		pipeline[row.status] = row._count.id;
	}
	return pipeline;
}

/**
 * Get pending subcontract claims count
 */
export async function getPendingSubcontractClaimsCount(
	organizationId: string,
) {
	return db.subcontractClaim.count({
		where: {
			organizationId,
			status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] },
		},
	});
}

/**
 * Get invoice totals (invoiced, collected, outstanding)
 */
export async function getInvoiceTotals(organizationId: string) {
	// One aggregate for both sums — the WHERE was identical in both.
	const totals = await db.financeInvoice.aggregate({
		where: {
			organizationId,
			status: { notIn: ["DRAFT", "CANCELLED"] },
		},
		_sum: { totalAmount: true, paidAmount: true },
	});

	const totalInvoiced = totals._sum.totalAmount
		? Number(totals._sum.totalAmount)
		: 0;
	const totalCollected = totals._sum.paidAmount
		? Number(totals._sum.paidAmount)
		: 0;
	const totalOutstanding = totalInvoiced - totalCollected;

	return { totalInvoiced, totalCollected, totalOutstanding };
}

/**
 * Get monthly financial trend for charts (last 6 months)
 */
// Monthly cash-flow trend for the dashboard finance card.
//
// Derived from the POSTED general ledger (JournalEntryLine) on the cash/bank
// accounts (1110 "النقدية والبنوك" + its children), exactly like the canonical
// cash-flow report (queries/cash-flow.ts). Reading the ledger captures EVERY
// real cash movement once — invoice/project/direct payments, vouchers, expenses,
// subcontractor payments, payroll, capital & drawings — instead of only the
// rarely-used project_expenses/project_claims tables (which left the card empty).
//
// `claims`   = cash inflows  (revenue line, blue)
// `expenses` = cash outflows (red)
export async function getMonthlyFinancialTrend(organizationId: string) {
	// Window: first day of the month 5 months ago → now (6 calendar months).
	const now = new Date();
	const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

	// Pre-seed the last 6 months so the chart always renders an axis even when
	// some months have no movement.
	const monthlyData = new Map<string, { expenses: number; claims: number }>();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		monthlyData.set(key, { expenses: 0, claims: 0 });
	}

	// In-range POSTED lines on the cash/bank accounts (1110 + its children),
	// grouped per entry so each entry yields a single net cash movement
	// (internal transfers between own cash accounts net to ~0).
	//
	// The account filter is expressed as a relation predicate so the previous
	// 3-step serial chain (find 1110 → find children → find lines) collapses to
	// ONE round-trip — that chain sat on the critical path of every homepage
	// load at cross-region latency per step. An org without accounting simply
	// matches no rows (same result as the old early-return).
	const lines = await db.journalEntryLine.findMany({
		where: {
			account: {
				organizationId,
				OR: [
					{ code: "1110" },
					{ parent: { organizationId, code: "1110" } },
				],
			},
			journalEntry: {
				organizationId,
				status: { in: ["POSTED", "REVERSED"] },
				date: { gte: windowStart, lte: now },
				referenceType: { not: "OPENING_BALANCE" },
			},
		},
		select: {
			journalEntryId: true,
			debit: true,
			credit: true,
			journalEntry: { select: { date: true } },
		},
	});

	const byEntry = new Map<string, { date: Date; cashDelta: number }>();
	for (const line of lines) {
		let g = byEntry.get(line.journalEntryId);
		if (!g) {
			g = { date: new Date(line.journalEntry.date), cashDelta: 0 };
			byEntry.set(line.journalEntryId, g);
		}
		g.cashDelta += Number(line.debit) - Number(line.credit);
	}

	for (const g of byEntry.values()) {
		// Skip net-zero internal transfers between own cash/bank accounts.
		if (Math.abs(g.cashDelta) < 0.005) continue;
		const key = `${g.date.getFullYear()}-${String(g.date.getMonth() + 1).padStart(2, "0")}`;
		const bucket = monthlyData.get(key);
		if (!bucket) continue;
		if (g.cashDelta > 0) bucket.claims += g.cashDelta;
		else bucket.expenses += -g.cashDelta;
	}

	return Array.from(monthlyData.entries())
		.map(([month, data]) => ({
			month,
			expenses: data.expenses,
			claims: data.claims,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));
}

// ═══════════════════════════════════════════════════════════════════════════
// Active Projects (dashboard card) - المشاريع النشطة (بطاقة لوحة القيادة)
// Enriched per-project cards: progress (from the project itself), مدفوعات
// (ProjectExpense sum), مقبوضات (ProjectPayment sum), current milestone + days
// on it, and the latest published photos — all scoped to the organization.
// ═══════════════════════════════════════════════════════════════════════════

export async function getActiveProjectsForDashboard(
	organizationId: string,
	options?: {
		limit?: number;
		/** Per-member visibility restriction (mirrors list-projects). */
		restrictToProjectIds?: string[];
	},
) {
	const limit = options?.limit ?? 4;
	const where: {
		organizationId: string;
		status: "ACTIVE";
		id?: { in: string[] };
	} = { organizationId, status: "ACTIVE" };
	if (options?.restrictToProjectIds) {
		where.id = { in: options.restrictToProjectIds };
	}

	const projects = await db.project.findMany({
		where,
		include: {
			coverPhoto: { select: { url: true } },
			photos: {
				take: 4,
				orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
				select: { url: true },
			},
			milestones: {
				where: { status: { in: ["IN_PROGRESS", "PLANNED"] } },
				orderBy: { orderIndex: "asc" },
				take: 8,
				select: {
					title: true,
					status: true,
					actualStart: true,
					plannedStart: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	const projectIds = projects.map((p) => p.id);

	const [expenseSums, paymentSums] = await Promise.all([
		projectIds.length
			? db.projectExpense.groupBy({
					by: ["projectId"],
					where: { projectId: { in: projectIds } },
					_sum: { amount: true },
				})
			: Promise.resolve(
					[] as { projectId: string; _sum: { amount: unknown } }[],
				),
		projectIds.length
			? db.projectPayment.groupBy({
					by: ["projectId"],
					where: { projectId: { in: projectIds } },
					_sum: { amount: true },
				})
			: Promise.resolve(
					[] as { projectId: string; _sum: { amount: unknown } }[],
				),
	]);

	const expenseMap = new Map(
		expenseSums.map((e) => [e.projectId, Number(e._sum.amount ?? 0)]),
	);
	const paymentMap = new Map(
		paymentSums.map((p) => [p.projectId, Number(p._sum.amount ?? 0)]),
	);

	const now = new Date();
	const DAY_MS = 24 * 60 * 60 * 1000;

	return projects.map((p) => {
		// Current milestone: the one IN_PROGRESS, otherwise the next PLANNED one
		// (list is already ordered by orderIndex).
		const current =
			p.milestones.find((m) => m.status === "IN_PROGRESS") ??
			p.milestones[0] ??
			null;

		let currentMilestone: { title: string; days: number | null } | null = null;
		if (current) {
			const start = current.actualStart ?? current.plannedStart;
			const days = start
				? Math.max(
						0,
						Math.floor((now.getTime() - new Date(start).getTime()) / DAY_MS),
					)
				: null;
			currentMilestone = { title: current.title, days };
		}

		return {
			id: p.id,
			name: p.name,
			clientName: p.clientName,
			progress: Number(p.progress),
			coverPhoto: p.coverPhoto,
			photos: p.photos,
			expensesTotal: expenseMap.get(p.id) ?? 0,
			paymentsTotal: paymentMap.get(p.id) ?? 0,
			currentMilestone,
		};
	});
}
