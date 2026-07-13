import { db } from "../client";

// Type definitions for field execution enums
// These match the Prisma schema enums
type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type PhotoCategory = "PROGRESS" | "ISSUE" | "EQUIPMENT" | "MATERIAL" | "SAFETY" | "OTHER";
type MediaType = "PHOTO" | "VIDEO";
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
		milestoneId?: string | null; // null = أرفق الصور بدون مرحلة فقط
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		projectId: string;
		category?: PhotoCategory;
		milestoneId?: string | null;
	} = { projectId };

	if (options?.category) {
		where.category = options.category;
	}

	if (options?.milestoneId === null) {
		where.milestoneId = null;
	} else if (options?.milestoneId) {
		where.milestoneId = options.milestoneId;
	}

	const [photos, total, project] = await Promise.all([
		db.projectPhoto.findMany({
			where,
			include: {
				uploadedBy: { select: { id: true, name: true, image: true } },
				milestone: { select: { id: true, title: true, status: true, orderIndex: true } },
			},
			// Order by the photo's actual date (takenAt) so photos land in their
			// chronological position regardless of when they were uploaded.
			orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.projectPhoto.count({ where }),
		db.project.findUnique({
			where: { id: projectId },
			select: { coverPhotoId: true },
		}),
	]);

	return { photos, total, coverPhotoId: project?.coverPhotoId ?? null };
}

/**
 * Create a new photo or video
 */
export async function createPhoto(data: {
	projectId: string;
	uploadedById: string;
	url: string;
	caption?: string;
	category?: PhotoCategory;
	mediaType?: MediaType;
	mimeType?: string;
	milestoneId?: string;
	takenAt?: Date;
}) {
	return db.projectPhoto.create({
		data: {
			projectId: data.projectId,
			uploadedById: data.uploadedById,
			url: data.url,
			caption: data.caption,
			category: data.category ?? "PROGRESS",
			mediaType: data.mediaType ?? "PHOTO",
			mimeType: data.mimeType,
			milestoneId: data.milestoneId,
			takenAt: data.takenAt ?? new Date(),
		},
		include: {
			uploadedBy: { select: { id: true, name: true, image: true } },
			milestone: { select: { id: true, title: true, status: true, orderIndex: true } },
		},
	});
}

/**
 * Update photo metadata (caption / category / milestone link)
 */
export async function updatePhoto(
	photoId: string,
	projectId: string,
	data: {
		caption?: string | null;
		category?: PhotoCategory;
		milestoneId?: string | null;
		takenAt?: Date;
	},
) {
	const existing = await db.projectPhoto.findFirst({
		where: { id: photoId, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("الصورة غير موجودة أو لا تنتمي لهذا المشروع");
	}

	// Validate milestone belongs to same project (if provided)
	if (data.milestoneId) {
		const milestone = await db.projectMilestone.findFirst({
			where: { id: data.milestoneId, projectId },
			select: { id: true },
		});
		if (!milestone) {
			throw new Error("المرحلة غير موجودة أو لا تنتمي لهذا المشروع");
		}
	}

	return db.projectPhoto.update({
		where: { id: photoId },
		data: {
			caption: data.caption,
			category: data.category,
			milestoneId: data.milestoneId,
			takenAt: data.takenAt,
		},
		include: {
			uploadedBy: { select: { id: true, name: true, image: true } },
			milestone: { select: { id: true, title: true, status: true, orderIndex: true } },
		},
	});
}

/**
 * Set a photo as the project's cover image
 */
export async function setProjectCoverPhoto(projectId: string, photoId: string) {
	const photo = await db.projectPhoto.findFirst({
		where: { id: photoId, projectId },
		select: { id: true },
	});

	if (!photo) {
		throw new Error("الصورة غير موجودة أو لا تنتمي لهذا المشروع");
	}

	return db.project.update({
		where: { id: projectId },
		data: { coverPhotoId: photoId },
		select: { id: true, coverPhotoId: true },
	});
}

/**
 * Remove the project's cover image
 */
export async function unsetProjectCoverPhoto(projectId: string) {
	return db.project.update({
		where: { id: projectId },
		data: { coverPhotoId: null },
		select: { id: true, coverPhotoId: true },
	});
}

/**
 * Delete a photo by ID (must belong to project)
 */
export async function deletePhoto(photoId: string, projectId: string) {
	const existing = await db.projectPhoto.findFirst({
		where: { id: photoId, projectId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("الصورة غير موجودة أو لا تنتمي لهذا المشروع");
	}

	const deleted = await db.projectPhoto.delete({
		where: { id: photoId },
	});

	return deleted;
}

/**
 * Bulk-update metadata for several photos at once (must belong to project).
 * Any field left undefined is unchanged; milestoneId === null detaches.
 */
export async function bulkUpdatePhotos(
	photoIds: string[],
	projectId: string,
	data: {
		category?: PhotoCategory;
		milestoneId?: string | null;
		takenAt?: Date;
	},
) {
	if (photoIds.length === 0) {
		return { count: 0 };
	}

	// Validate milestone belongs to same project (if attaching)
	if (data.milestoneId) {
		const milestone = await db.projectMilestone.findFirst({
			where: { id: data.milestoneId, projectId },
			select: { id: true },
		});
		if (!milestone) {
			throw new Error("المرحلة غير موجودة أو لا تنتمي لهذا المشروع");
		}
	}

	// Only photos that actually belong to this project are touched.
	return db.projectPhoto.updateMany({
		where: { id: { in: photoIds }, projectId },
		data: {
			category: data.category,
			milestoneId: data.milestoneId,
			takenAt: data.takenAt,
		},
	});
}

/**
 * Bulk-delete several photos at once (must belong to project).
 */
export async function bulkDeletePhotos(photoIds: string[], projectId: string) {
	if (photoIds.length === 0) {
		return { count: 0 };
	}

	return db.projectPhoto.deleteMany({
		where: { id: { in: photoIds }, projectId },
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
// Field Activity Summary (org-wide) - ملخص النشاط الميداني على مستوى المنظمة
// Powers the dashboard "النشاط الميداني" card: site updates + open issues.
// All field models (photos/reports/progress/issues) are per-project, so every
// aggregation is scoped through `project: { organizationId }`.
// ═══════════════════════════════════════════════════════════════════════════

export async function getFieldActivitySummary(organizationId: string) {
	const now = new Date();
	const startOfToday = new Date(now);
	startOfToday.setUTCHours(0, 0, 0, 0);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const DAY_MS = 24 * 60 * 60 * 1000;

	// Active projects are the "sites" we track for freshness.
	const activeProjects = await db.project.findMany({
		where: { organizationId, status: "ACTIVE" },
		select: { id: true, name: true, createdAt: true },
	});
	const activeIds = activeProjects.map((p) => p.id);
	const hasActive = activeIds.length > 0;

	const [
		// Distinct projects with any activity today (3 sources)
		photosToday,
		reportsToday,
		progressToday,
		// New media/reports in the last 7 days
		newPhotos,
		newDailyReports,
		newProgressUpdates,
		// Last-activity timestamps per project (for the stalest site)
		photoLast,
		reportLast,
		progressLast,
		// Open issues + high priority (across all org projects)
		openCount,
		highPriorityCount,
		// Recently resolved issues for the average-resolution figure
		resolvedIssues,
	] = await Promise.all([
		hasActive
			? db.projectPhoto.findMany({
					where: { projectId: { in: activeIds }, createdAt: { gte: startOfToday } },
					select: { projectId: true },
					distinct: ["projectId"],
				})
			: Promise.resolve([] as { projectId: string }[]),
		hasActive
			? db.projectDailyReport.findMany({
					where: { projectId: { in: activeIds }, reportDate: { gte: startOfToday } },
					select: { projectId: true },
					distinct: ["projectId"],
				})
			: Promise.resolve([] as { projectId: string }[]),
		hasActive
			? db.projectProgressUpdate.findMany({
					where: { projectId: { in: activeIds }, createdAt: { gte: startOfToday } },
					select: { projectId: true },
					distinct: ["projectId"],
				})
			: Promise.resolve([] as { projectId: string }[]),
		db.projectPhoto.count({
			where: { project: { organizationId }, createdAt: { gte: sevenDaysAgo } },
		}),
		db.projectDailyReport.count({
			where: { project: { organizationId }, createdAt: { gte: sevenDaysAgo } },
		}),
		db.projectProgressUpdate.count({
			where: { project: { organizationId }, createdAt: { gte: sevenDaysAgo } },
		}),
		hasActive
			? db.projectPhoto.groupBy({
					by: ["projectId"],
					where: { projectId: { in: activeIds } },
					_max: { createdAt: true },
				})
			: Promise.resolve([] as { projectId: string; _max: { createdAt: Date | null } }[]),
		hasActive
			? db.projectDailyReport.groupBy({
					by: ["projectId"],
					where: { projectId: { in: activeIds } },
					_max: { createdAt: true },
				})
			: Promise.resolve([] as { projectId: string; _max: { createdAt: Date | null } }[]),
		hasActive
			? db.projectProgressUpdate.groupBy({
					by: ["projectId"],
					where: { projectId: { in: activeIds } },
					_max: { createdAt: true },
				})
			: Promise.resolve([] as { projectId: string; _max: { createdAt: Date | null } }[]),
		db.projectIssue.count({
			where: {
				project: { organizationId },
				status: { in: ["OPEN", "IN_PROGRESS"] },
			},
		}),
		db.projectIssue.count({
			where: {
				project: { organizationId },
				status: { in: ["OPEN", "IN_PROGRESS"] },
				severity: { in: ["HIGH", "CRITICAL"] },
			},
		}),
		db.projectIssue.findMany({
			where: {
				project: { organizationId },
				status: { in: ["RESOLVED", "CLOSED"] },
				resolvedAt: { not: null },
			},
			select: { createdAt: true, resolvedAt: true },
			orderBy: { resolvedAt: "desc" },
			take: 200,
		}),
	]);

	// Projects updated today = union of the three activity sources.
	const updatedTodaySet = new Set<string>();
	for (const row of [...photosToday, ...reportsToday, ...progressToday]) {
		updatedTodaySet.add(row.projectId);
	}

	// Last field activity per active project (fall back to nothing = never).
	const lastActivity = new Map<string, number>();
	for (const rows of [photoLast, reportLast, progressLast]) {
		for (const r of rows) {
			const ts = r._max.createdAt?.getTime();
			if (ts === undefined) continue;
			const prev = lastActivity.get(r.projectId);
			if (prev === undefined || ts > prev) {
				lastActivity.set(r.projectId, ts);
			}
		}
	}

	// Stalest site: the active project (that had activity at least once) whose
	// last update is the oldest. Only surfaced once it has gone quiet (≥2 days).
	let stalest: { projectName: string; days: number } | null = null;
	for (const p of activeProjects) {
		const last = lastActivity.get(p.id);
		if (last === undefined) continue; // never had field activity → skip
		const days = Math.floor((now.getTime() - last) / DAY_MS);
		if (days >= 2 && (stalest === null || days > stalest.days)) {
			stalest = { projectName: p.name, days };
		}
	}

	// Average resolution time in whole days.
	let avgResolutionDays: number | null = null;
	if (resolvedIssues.length > 0) {
		let sum = 0;
		let n = 0;
		for (const iss of resolvedIssues) {
			if (!iss.resolvedAt) continue;
			const diff = iss.resolvedAt.getTime() - iss.createdAt.getTime();
			if (diff < 0) continue;
			sum += diff;
			n += 1;
		}
		if (n > 0) {
			avgResolutionDays = Math.max(1, Math.round(sum / n / DAY_MS));
		}
	}

	return {
		siteUpdates: {
			updatedTodayCount: updatedTodaySet.size,
			newPhotos,
			newReports: newDailyReports + newProgressUpdates,
			stalest,
		},
		issues: {
			openCount,
			highPriorityCount,
			avgResolutionDays,
		},
	};
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
		id: string;
		type: "DAILY_REPORT" | "PHOTO" | "ISSUE" | "PROGRESS_UPDATE";
		data: Record<string, unknown>;
		createdAt: Date;
	}

	const timeline: TimelineItem[] = [
		...reports.map((r: { id: string; createdAt: Date; [key: string]: unknown }) => ({
			id: r.id,
			type: "DAILY_REPORT" as const,
			data: r as Record<string, unknown>,
			createdAt: r.createdAt,
		})),
		...photos.map((p: { id: string; createdAt: Date; [key: string]: unknown }) => ({
			id: p.id,
			type: "PHOTO" as const,
			data: p as Record<string, unknown>,
			createdAt: p.createdAt,
		})),
		...issues.map((i: { id: string; createdAt: Date; [key: string]: unknown }) => ({
			id: i.id,
			type: "ISSUE" as const,
			data: i as Record<string, unknown>,
			createdAt: i.createdAt,
		})),
		...progressUpdates.map((u: { id: string; createdAt: Date; [key: string]: unknown }) => ({
			id: u.id,
			type: "PROGRESS_UPDATE" as const,
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
