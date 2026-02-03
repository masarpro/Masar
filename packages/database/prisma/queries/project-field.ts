import { db } from "../client";

// Type definitions for field execution enums
// These match the Prisma schema enums
type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type PhotoCategory = "PROGRESS" | "ISSUE" | "EQUIPMENT" | "MATERIAL" | "SAFETY" | "OTHER";
type WeatherCondition = "SUNNY" | "CLOUDY" | "RAINY" | "WINDY" | "DUSTY" | "HOT" | "COLD";

// ═══════════════════════════════════════════════════════════════════════════
// Daily Report Queries - التقارير اليومية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all daily reports for a project
 */
export async function getProjectDailyReports(
	projectId: string,
	options?: {
		limit?: number;
		offset?: number;
	},
) {
	const [reports, total] = await Promise.all([
		db.projectDailyReport.findMany({
			where: { projectId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { reportDate: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectDailyReport.count({ where: { projectId } }),
	]);

	return { reports, total };
}

/**
 * Get a daily report by ID
 */
export async function getDailyReportById(id: string, projectId: string) {
	return db.projectDailyReport.findFirst({
		where: { id, projectId },
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
		},
	});
}

/**
 * Create a new daily report
 */
export async function createDailyReport(data: {
	projectId: string;
	createdById: string;
	reportDate: Date;
	manpower: number;
	equipment?: string;
	workDone: string;
	blockers?: string;
	weather?: WeatherCondition;
}) {
	return db.projectDailyReport.create({
		data: {
			projectId: data.projectId,
			createdById: data.createdById,
			reportDate: data.reportDate,
			manpower: data.manpower,
			equipment: data.equipment,
			workDone: data.workDone,
			blockers: data.blockers,
			weather: data.weather ?? "SUNNY",
		},
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Photo Queries - الصور
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all photos for a project
 */
export async function getProjectPhotos(
	projectId: string,
	options?: {
		category?: PhotoCategory;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		projectId: string;
		category?: PhotoCategory;
	} = { projectId };

	if (options?.category) {
		where.category = options.category;
	}

	const [photos, total] = await Promise.all([
		db.projectPhoto.findMany({
			where,
			include: {
				uploadedBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectPhoto.count({ where }),
	]);

	return { photos, total };
}

/**
 * Create a new photo
 */
export async function createPhoto(data: {
	projectId: string;
	uploadedById: string;
	url: string;
	caption?: string;
	category?: PhotoCategory;
	takenAt?: Date;
}) {
	return db.projectPhoto.create({
		data: {
			projectId: data.projectId,
			uploadedById: data.uploadedById,
			url: data.url,
			caption: data.caption,
			category: data.category ?? "PROGRESS",
			takenAt: data.takenAt ?? new Date(),
		},
		include: {
			uploadedBy: { select: { id: true, name: true, image: true } },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Issue Queries - المشاكل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all issues for a project
 */
export async function getProjectIssues(
	projectId: string,
	options?: {
		status?: IssueStatus;
		severity?: IssueSeverity;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		projectId: string;
		status?: IssueStatus;
		severity?: IssueSeverity;
	} = { projectId };

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.severity) {
		where.severity = options.severity;
	}

	const [issues, total] = await Promise.all([
		db.projectIssue.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignee: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectIssue.count({ where }),
	]);

	return { issues, total };
}

/**
 * Get an issue by ID
 */
export async function getIssueById(id: string, projectId: string) {
	return db.projectIssue.findFirst({
		where: { id, projectId },
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
			assignee: { select: { id: true, name: true, image: true } },
		},
	});
}

/**
 * Create a new issue
 */
export async function createIssue(data: {
	projectId: string;
	createdById: string;
	title: string;
	description: string;
	severity?: IssueSeverity;
	dueDate?: Date;
	assigneeId?: string;
}) {
	return db.projectIssue.create({
		data: {
			projectId: data.projectId,
			createdById: data.createdById,
			title: data.title,
			description: data.description,
			severity: data.severity ?? "MEDIUM",
			status: "OPEN",
			dueDate: data.dueDate,
			assigneeId: data.assigneeId,
		},
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
			assignee: { select: { id: true, name: true, image: true } },
		},
	});
}

/**
 * Update an issue
 */
export async function updateIssue(
	id: string,
	projectId: string,
	data: Partial<{
		title: string;
		description: string;
		severity: IssueSeverity;
		status: IssueStatus;
		dueDate: Date | null;
		assigneeId: string | null;
	}>,
) {
	// Verify the issue belongs to this project
	const existing = await db.projectIssue.findFirst({
		where: { id, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Issue not found");
	}

	// If resolving the issue, set resolvedAt
	const updateData: typeof data & { resolvedAt?: Date | null } = { ...data };
	if (data.status === "RESOLVED" || data.status === "CLOSED") {
		updateData.resolvedAt = new Date();
	} else if (data.status === "OPEN" || data.status === "IN_PROGRESS") {
		updateData.resolvedAt = null;
	}

	return db.projectIssue.update({
		where: { id },
		data: updateData,
		include: {
			createdBy: { select: { id: true, name: true, image: true } },
			assignee: { select: { id: true, name: true, image: true } },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Progress Update Queries - تحديثات التقدم
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all progress updates for a project
 */
export async function getProjectProgressUpdates(
	projectId: string,
	options?: {
		limit?: number;
		offset?: number;
	},
) {
	const [updates, total] = await Promise.all([
		db.projectProgressUpdate.findMany({
			where: { projectId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectProgressUpdate.count({ where: { projectId } }),
	]);

	return { updates, total };
}

/**
 * Add a progress update and update the project's progress
 */
export async function addProgressUpdate(data: {
	projectId: string;
	createdById: string;
	progress: number;
	phaseLabel?: string;
	note?: string;
}) {
	// Use a transaction to update both the progress update and the project
	const [progressUpdate] = await db.$transaction([
		db.projectProgressUpdate.create({
			data: {
				projectId: data.projectId,
				createdById: data.createdById,
				progress: data.progress,
				phaseLabel: data.phaseLabel,
				note: data.note,
			},
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
		}),
		db.project.update({
			where: { id: data.projectId },
			data: { progress: data.progress },
		}),
	]);

	return progressUpdate;
}

// ═══════════════════════════════════════════════════════════════════════════
// Field Timeline - الجدول الزمني الميداني
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all field activities for the timeline view
 */
export async function getFieldTimeline(
	projectId: string,
	options?: {
		limit?: number;
		offset?: number;
	},
) {
	const limit = options?.limit ?? 20;
	const offset = options?.offset ?? 0;

	// Fetch all types of activities
	const [reports, photos, issues, progressUpdates] = await Promise.all([
		db.projectDailyReport.findMany({
			where: { projectId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		}),
		db.projectPhoto.findMany({
			where: { projectId },
			include: {
				uploadedBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		}),
		db.projectIssue.findMany({
			where: { projectId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
				assignee: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		}),
		db.projectProgressUpdate.findMany({
			where: { projectId },
			include: {
				createdBy: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			take: limit,
		}),
	]);

	// Combine and sort by createdAt
	interface TimelineItem {
		type: "report" | "photo" | "issue" | "progress";
		data: Record<string, unknown>;
		createdAt: Date;
	}

	const timeline: TimelineItem[] = [
		...reports.map((r: { createdAt: Date; [key: string]: unknown }) => ({
			type: "report" as const,
			data: r as Record<string, unknown>,
			createdAt: r.createdAt,
		})),
		...photos.map((p: { createdAt: Date; [key: string]: unknown }) => ({
			type: "photo" as const,
			data: p as Record<string, unknown>,
			createdAt: p.createdAt,
		})),
		...issues.map((i: { createdAt: Date; [key: string]: unknown }) => ({
			type: "issue" as const,
			data: i as Record<string, unknown>,
			createdAt: i.createdAt,
		})),
		...progressUpdates.map((u: { createdAt: Date; [key: string]: unknown }) => ({
			type: "progress" as const,
			data: u as Record<string, unknown>,
			createdAt: u.createdAt,
		})),
	];

	// Sort by createdAt descending
	timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	// Apply pagination
	const paginatedTimeline = timeline.slice(offset, offset + limit);

	return {
		timeline: paginatedTimeline,
		total: timeline.length,
	};
}
