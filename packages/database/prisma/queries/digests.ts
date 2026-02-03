import { db } from "../client";
import type { DigestFrequency, NotificationChannel } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Digest Subscriptions & Weekly Digest Queries (Phase 7)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to digest
 */
export async function subscribeToDigest(data: {
	organizationId: string;
	userId: string;
	projectId?: string; // null = all projects
	frequency?: DigestFrequency;
	channel?: NotificationChannel;
}) {
	return db.digestSubscription.upsert({
		where: {
			organizationId_userId_projectId: {
				organizationId: data.organizationId,
				userId: data.userId,
				projectId: data.projectId ?? null,
			},
		},
		create: {
			organizationId: data.organizationId,
			userId: data.userId,
			projectId: data.projectId,
			frequency: data.frequency ?? "WEEKLY",
			channel: data.channel ?? "IN_APP",
			isEnabled: true,
		},
		update: {
			isEnabled: true,
			frequency: data.frequency,
			channel: data.channel,
		},
	});
}

/**
 * Unsubscribe from digest
 */
export async function unsubscribeFromDigest(data: {
	organizationId: string;
	userId: string;
	projectId?: string;
}) {
	return db.digestSubscription.updateMany({
		where: {
			organizationId: data.organizationId,
			userId: data.userId,
			projectId: data.projectId ?? null,
		},
		data: { isEnabled: false },
	});
}

/**
 * Get user's digest subscriptions
 */
export async function getUserDigestSubscriptions(
	organizationId: string,
	userId: string,
) {
	return db.digestSubscription.findMany({
		where: { organizationId, userId },
		include: {
			project: { select: { id: true, name: true, slug: true } },
		},
	});
}

/**
 * Generate weekly digest data for a user
 */
export async function generateWeeklyDigest(
	organizationId: string,
	userId: string,
	options?: {
		projectId?: string;
		weekStart?: Date;
	},
) {
	const weekStart =
		options?.weekStart ?? getStartOfWeek(new Date());
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	// Base project filter
	const projectFilter = options?.projectId
		? { id: options.projectId, organizationId }
		: { organizationId, status: "ACTIVE" as const };

	// Get projects in scope
	const projects = await db.project.findMany({
		where: projectFilter,
		select: { id: true, name: true, slug: true, progress: true },
	});

	const projectIds = projects.map((p) => p.id);

	// 1. Projects with missing daily reports (no report in last 2 days)
	const twoDaysAgo = new Date();
	twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

	const projectsWithRecentReports = await db.projectDailyReport.groupBy({
		by: ["projectId"],
		where: {
			projectId: { in: projectIds },
			reportDate: { gte: twoDaysAgo },
		},
	});

	const projectsWithReportsSet = new Set(
		projectsWithRecentReports.map((r) => r.projectId),
	);

	const projectsMissingReports = projects.filter(
		(p) => !projectsWithReportsSet.has(p.id),
	);

	// 2. Upcoming payments (next 7 days)
	const upcomingPayments = await db.projectClaim.findMany({
		where: {
			projectId: { in: projectIds },
			status: { in: ["APPROVED", "SUBMITTED"] },
			dueDate: { gte: new Date(), lte: weekEnd },
		},
		include: {
			project: { select: { id: true, name: true } },
		},
		orderBy: { dueDate: "asc" },
		take: 10,
	});

	// 3. Newly created issues this week
	const newIssues = await db.projectIssue.findMany({
		where: {
			projectId: { in: projectIds },
			createdAt: { gte: weekStart, lte: weekEnd },
		},
		include: {
			project: { select: { id: true, name: true } },
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	// 4. Progress changes this week
	const progressUpdates = await db.projectProgressUpdate.findMany({
		where: {
			projectId: { in: projectIds },
			createdAt: { gte: weekStart, lte: weekEnd },
		},
		include: {
			project: { select: { id: true, name: true } },
			createdBy: { select: { id: true, name: true } },
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	// 5. Open issues count per project
	const openIssuesCounts = await db.projectIssue.groupBy({
		by: ["projectId"],
		where: {
			projectId: { in: projectIds },
			status: { in: ["OPEN", "IN_PROGRESS"] },
		},
		_count: true,
	});

	// 6. Active alerts count
	const alertsCount = await db.projectAlert.count({
		where: {
			projectId: { in: projectIds },
			acknowledgedAt: null,
		},
	});

	return {
		weekStart,
		weekEnd,
		summary: {
			totalProjects: projects.length,
			projectsMissingReports: projectsMissingReports.length,
			upcomingPaymentsCount: upcomingPayments.length,
			newIssuesCount: newIssues.length,
			progressUpdatesCount: progressUpdates.length,
			activeAlertsCount: alertsCount,
		},
		projectsMissingReports: projectsMissingReports.map((p) => ({
			id: p.id,
			name: p.name,
			slug: p.slug,
		})),
		upcomingPayments: upcomingPayments.map((c) => ({
			id: c.id,
			claimNo: c.claimNo,
			amount: Number(c.amount),
			dueDate: c.dueDate,
			projectName: c.project.name,
		})),
		newIssues: newIssues.map((i) => ({
			id: i.id,
			title: i.title,
			severity: i.severity,
			projectName: i.project.name,
		})),
		progressUpdates: progressUpdates.map((p) => ({
			id: p.id,
			progress: p.progress,
			phaseLabel: p.phaseLabel,
			projectName: p.project.name,
			createdByName: p.createdBy.name,
			createdAt: p.createdAt,
		})),
		openIssuesByProject: openIssuesCounts.map((c) => ({
			projectId: c.projectId,
			count: c._count,
		})),
	};
}

/**
 * Get users subscribed to digest for a project (for sending notifications)
 */
export async function getDigestSubscribers(
	organizationId: string,
	projectId?: string,
) {
	return db.digestSubscription.findMany({
		where: {
			organizationId,
			isEnabled: true,
			OR: [{ projectId: null }, { projectId }],
		},
		include: {
			user: { select: { id: true, name: true, email: true } },
		},
	});
}

// Helper function
function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}
