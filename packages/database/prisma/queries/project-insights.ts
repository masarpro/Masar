import { db } from "../client";
import type { AlertType, AlertSeverity } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Insights & Alerts Queries - التنبيهات الذكية (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════

interface ComputedAlert {
	type: AlertType;
	severity: AlertSeverity;
	title: string;
	description: string;
	dedupeKey: string;
}

/**
 * Compute alerts for a project based on rules
 */
export async function computeProjectAlerts(
	organizationId: string,
	projectId: string,
): Promise<ComputedAlert[]> {
	const alerts: ComputedAlert[] = [];

	// Get project data
	const project = await db.project.findFirst({
		where: { id: projectId, organizationId },
		include: {
			_count: {
				select: {
					issues: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
				},
			},
		},
	});

	if (!project || project.status !== "ACTIVE") {
		return alerts;
	}

	const today = new Date();
	const twoDaysAgo = new Date(today);
	twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

	const sevenDaysAgo = new Date(today);
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	// 1. Check for missing daily report (none in last 2 days)
	const recentReports = await db.projectDailyReport.count({
		where: {
			projectId,
			reportDate: { gte: twoDaysAgo },
		},
	});

	if (recentReports === 0) {
		const weekKey = getWeekKey(today);
		alerts.push({
			type: "MISSING_DAILY_REPORT",
			severity: "WARN",
			title: "تقرير يومي مفقود",
			description: "لم يتم إضافة تقرير يومي منذ يومين أو أكثر",
			dedupeKey: `${projectId}_MISSING_DAILY_REPORT_${weekKey}`,
		});
	}

	// 2. Check for stale progress (no update in 7 days)
	const recentProgress = await db.projectProgressUpdate.count({
		where: {
			projectId,
			createdAt: { gte: sevenDaysAgo },
		},
	});

	if (recentProgress === 0) {
		const weekKey = getWeekKey(today);
		alerts.push({
			type: "STALE_PROGRESS",
			severity: "INFO",
			title: "تقدم قديم",
			description: "لم يتم تحديث نسبة التقدم منذ 7 أيام",
			dedupeKey: `${projectId}_STALE_PROGRESS_${weekKey}`,
		});
	}

	// 3. Check for overdue payments
	const overdueClaims = await db.projectClaim.count({
		where: {
			projectId,
			status: "APPROVED",
			dueDate: { lt: today },
		},
	});

	if (overdueClaims > 0) {
		const monthKey = getMonthKey(today);
		alerts.push({
			type: "OVERDUE_PAYMENT",
			severity: "CRITICAL",
			title: "دفعة متأخرة",
			description: `يوجد ${overdueClaims} مستخلص(ات) معتمدة تجاوزت تاريخ الاستحقاق`,
			dedupeKey: `${projectId}_OVERDUE_PAYMENT_${monthKey}`,
		});
	}

	// 4. Check for cost overrun risk
	if (project.contractValue) {
		const expensesSum = await db.projectExpense.aggregate({
			where: { projectId },
			_sum: { amount: true },
		});

		const totalExpenses = expensesSum._sum.amount
			? Number(expensesSum._sum.amount)
			: 0;
		const contractValue = Number(project.contractValue);
		const expenseRatio = totalExpenses / contractValue;
		const progressRatio = project.progress / 100;

		// Risk: expenses > 80% while progress < 70%
		if (expenseRatio > 0.8 && progressRatio < 0.7) {
			const monthKey = getMonthKey(today);
			alerts.push({
				type: "COST_OVERRUN_RISK",
				severity: "CRITICAL",
				title: "خطر تجاوز التكلفة",
				description: `المصروفات بلغت ${Math.round(expenseRatio * 100)}% من العقد بينما التقدم ${Math.round(progressRatio * 100)}% فقط`,
				dedupeKey: `${projectId}_COST_OVERRUN_RISK_${monthKey}`,
			});
		}
	}

	// 5. Check for too many open issues (> 10)
	if (project._count.issues > 10) {
		const weekKey = getWeekKey(today);
		alerts.push({
			type: "TOO_MANY_OPEN_ISSUES",
			severity: "WARN",
			title: "مشاكل مفتوحة كثيرة",
			description: `يوجد ${project._count.issues} مشكلة مفتوحة تحتاج معالجة`,
			dedupeKey: `${projectId}_TOO_MANY_OPEN_ISSUES_${weekKey}`,
		});
	}

	return alerts;
}

/**
 * Get or create alerts for a project (upsert based on dedupeKey)
 */
export async function getProjectInsights(
	organizationId: string,
	projectId: string,
) {
	// Compute current alerts
	const computedAlerts = await computeProjectAlerts(organizationId, projectId);

	// Upsert alerts (create if not exists based on dedupeKey)
	for (const alert of computedAlerts) {
		await db.projectAlert.upsert({
			where: { dedupeKey: alert.dedupeKey },
			create: {
				organizationId,
				projectId,
				type: alert.type,
				severity: alert.severity,
				title: alert.title,
				description: alert.description,
				dedupeKey: alert.dedupeKey,
			},
			update: {
				// Update title/description if rule logic changed
				title: alert.title,
				description: alert.description,
				severity: alert.severity,
			},
		});
	}

	// Get all active (unacknowledged) alerts for the project
	const activeAlerts = await db.projectAlert.findMany({
		where: {
			organizationId,
			projectId,
			acknowledgedAt: null,
		},
		include: {
			acknowledgedBy: { select: { id: true, name: true } },
		},
		orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
	});

	// Get acknowledged alerts (last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const acknowledgedAlerts = await db.projectAlert.findMany({
		where: {
			organizationId,
			projectId,
			acknowledgedAt: { not: null, gte: thirtyDaysAgo },
		},
		include: {
			acknowledgedBy: { select: { id: true, name: true } },
		},
		orderBy: { acknowledgedAt: "desc" },
		take: 10,
	});

	return {
		activeAlerts,
		acknowledgedAlerts,
		stats: {
			critical: activeAlerts.filter((a) => a.severity === "CRITICAL").length,
			warnings: activeAlerts.filter((a) => a.severity === "WARN").length,
			info: activeAlerts.filter((a) => a.severity === "INFO").length,
		},
	};
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
	alertId: string,
	organizationId: string,
	projectId: string,
	userId: string,
) {
	const alert = await db.projectAlert.findFirst({
		where: { id: alertId, organizationId, projectId },
	});

	if (!alert) {
		throw new Error("Alert not found");
	}

	return db.projectAlert.update({
		where: { id: alertId },
		data: {
			acknowledgedAt: new Date(),
			acknowledgedById: userId,
		},
	});
}

/**
 * Get alerts summary for organization (all projects)
 */
export async function getOrganizationAlertsSummary(organizationId: string) {
	const activeAlerts = await db.projectAlert.findMany({
		where: {
			organizationId,
			acknowledgedAt: null,
		},
		include: {
			project: { select: { id: true, name: true, slug: true } },
		},
		orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
		take: 20,
	});

	const stats = await db.projectAlert.groupBy({
		by: ["severity"],
		where: {
			organizationId,
			acknowledgedAt: null,
		},
		_count: true,
	});

	return {
		alerts: activeAlerts,
		stats: {
			critical:
				stats.find((s) => s.severity === "CRITICAL")?._count ?? 0,
			warnings: stats.find((s) => s.severity === "WARN")?._count ?? 0,
			info: stats.find((s) => s.severity === "INFO")?._count ?? 0,
			total: activeAlerts.length,
		},
	};
}

// Helper functions
function getWeekKey(date: Date): string {
	const year = date.getFullYear();
	const startOfYear = new Date(year, 0, 1);
	const days = Math.floor(
		(date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
	);
	const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
	return `${year}W${week}`;
}

function getMonthKey(date: Date): string {
	return `${date.getFullYear()}M${date.getMonth() + 1}`;
}
