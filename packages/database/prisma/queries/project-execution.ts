import { db } from "../client";
import type {
	ActivityStatus,
	DependencyType,
	ProgressMethod,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Execution Queries (Phase 13)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Internal Helpers ────────────────────────────────────────────────────

/**
 * Recalculate milestone progress based on its progressMethod.
 * Called after activity progress updates, checklist toggles, etc.
 */
async function recalculateMilestoneProgress(
	organizationId: string,
	projectId: string,
	milestoneId: string,
) {
	const milestone = await db.projectMilestone.findFirst({
		where: { id: milestoneId, organizationId, projectId },
		select: { progressMethod: true },
	});

	if (!milestone) return;

	if (milestone.progressMethod === "MANUAL") return;

	if (milestone.progressMethod === "ACTIVITIES") {
		const activities = await db.projectActivity.findMany({
			where: { organizationId, projectId, milestoneId },
			select: { progress: true, weight: true },
		});

		if (activities.length === 0) return;

		let totalWeight = 0;
		let weightedProgress = 0;

		for (const a of activities) {
			const w = a.weight ?? 1;
			totalWeight += w;
			weightedProgress += a.progress * w;
		}

		const newProgress =
			totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

		await db.projectMilestone.update({
			where: { id: milestoneId },
			data: { progress: newProgress },
		});
	}

	if (milestone.progressMethod === "CHECKLIST") {
		// For CHECKLIST mode, calculate from all checklist items across all activities
		const activities = await db.projectActivity.findMany({
			where: { organizationId, projectId, milestoneId },
			select: { id: true },
		});

		if (activities.length === 0) return;

		const activityIds = activities.map((a) => a.id);

		const totalItems = await db.activityChecklist.count({
			where: { activityId: { in: activityIds } },
		});

		if (totalItems === 0) return;

		const completedItems = await db.activityChecklist.count({
			where: { activityId: { in: activityIds }, isCompleted: true },
		});

		const newProgress = Math.round((completedItems / totalItems) * 100);

		await db.projectMilestone.update({
			where: { id: milestoneId },
			data: { progress: newProgress },
		});
	}
}

// ─── Activities ──────────────────────────────────────────────────────────

export async function listActivities(
	organizationId: string,
	projectId: string,
	milestoneId?: string,
) {
	return db.projectActivity.findMany({
		where: {
			organizationId,
			projectId,
			...(milestoneId ? { milestoneId } : {}),
		},
		include: {
			checklists: { orderBy: { orderIndex: "asc" } },
			assignee: { select: { id: true, name: true, image: true } },
		},
		orderBy: [{ milestoneId: "asc" }, { orderIndex: "asc" }],
	});
}

export async function getActivity(
	organizationId: string,
	projectId: string,
	activityId: string,
) {
	return db.projectActivity.findFirst({
		where: { id: activityId, organizationId, projectId },
		include: {
			checklists: { orderBy: { orderIndex: "asc" } },
			assignee: { select: { id: true, name: true, image: true } },
			predecessorOf: {
				include: {
					successor: { select: { id: true, title: true } },
				},
			},
			successorOf: {
				include: {
					predecessor: { select: { id: true, title: true } },
				},
			},
		},
	});
}

export async function createActivity(
	organizationId: string,
	projectId: string,
	milestoneId: string,
	data: {
		title: string;
		description?: string;
		plannedStart?: Date;
		plannedEnd?: Date;
		duration?: number;
		weight?: number;
		assigneeId?: string;
		calendarId?: string;
		notes?: string;
	},
) {
	// Get milestone for WBS code generation
	const milestone = await db.projectMilestone.findFirst({
		where: { id: milestoneId, organizationId, projectId },
		select: { orderIndex: true },
	});

	if (!milestone) throw new Error("Milestone not found");

	// Get next orderIndex
	const lastActivity = await db.projectActivity.findFirst({
		where: { organizationId, projectId, milestoneId },
		orderBy: { orderIndex: "desc" },
		select: { orderIndex: true },
	});
	const orderIndex = (lastActivity?.orderIndex ?? -1) + 1;

	// Auto-generate WBS code: M{milestoneIndex}.A{activityIndex}
	const wbsCode = `M${milestone.orderIndex + 1}.A${orderIndex + 1}`;

	return db.projectActivity.create({
		data: {
			organizationId,
			projectId,
			milestoneId,
			title: data.title,
			description: data.description,
			wbsCode,
			plannedStart: data.plannedStart,
			plannedEnd: data.plannedEnd,
			duration: data.duration,
			weight: data.weight,
			assigneeId: data.assigneeId,
			calendarId: data.calendarId,
			notes: data.notes,
			orderIndex,
			status: "NOT_STARTED",
			progress: 0,
		},
	});
}

export async function updateActivity(
	organizationId: string,
	projectId: string,
	activityId: string,
	data: {
		title?: string;
		description?: string | null;
		plannedStart?: Date | null;
		plannedEnd?: Date | null;
		duration?: number | null;
		actualStart?: Date | null;
		actualEnd?: Date | null;
		status?: ActivityStatus;
		progress?: number;
		isCritical?: boolean;
		weight?: number | null;
		assigneeId?: string | null;
		calendarId?: string | null;
		notes?: string | null;
	},
) {
	const existing = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId, projectId },
	});

	if (!existing) throw new Error("Activity not found");

	return db.projectActivity.update({
		where: { id: activityId },
		data,
	});
}

export async function deleteActivity(
	organizationId: string,
	projectId: string,
	activityId: string,
) {
	const existing = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId, projectId },
		select: { milestoneId: true },
	});

	if (!existing) throw new Error("Activity not found");

	await db.projectActivity.delete({ where: { id: activityId } });

	// Recalculate milestone progress after deletion
	await recalculateMilestoneProgress(
		organizationId,
		projectId,
		existing.milestoneId,
	);
}

export async function reorderActivities(
	organizationId: string,
	projectId: string,
	milestoneId: string,
	activityIds: string[],
) {
	const updates = activityIds.map((id, index) =>
		db.projectActivity.updateMany({
			where: { id, organizationId, projectId, milestoneId },
			data: { orderIndex: index },
		}),
	);

	await db.$transaction(updates);

	return listActivities(organizationId, projectId, milestoneId);
}

export async function updateActivityProgress(
	organizationId: string,
	projectId: string,
	activityId: string,
	progress: number,
	status?: ActivityStatus,
) {
	const existing = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId, projectId },
		select: { milestoneId: true, status: true },
	});

	if (!existing) throw new Error("Activity not found");

	const clampedProgress = Math.min(100, Math.max(0, progress));

	// Auto-determine status if not provided
	let newStatus = status ?? existing.status;
	if (!status) {
		if (clampedProgress >= 100) {
			newStatus = "COMPLETED";
		} else if (clampedProgress > 0 && existing.status === "NOT_STARTED") {
			newStatus = "IN_PROGRESS";
		}
	}

	const activity = await db.projectActivity.update({
		where: { id: activityId },
		data: {
			progress: clampedProgress,
			status: newStatus,
			...(clampedProgress >= 100 && !status
				? { actualEnd: new Date() }
				: {}),
			...(clampedProgress > 0 &&
			existing.status === "NOT_STARTED" &&
			!status
				? { actualStart: new Date() }
				: {}),
		},
	});

	// Recalculate milestone progress
	await recalculateMilestoneProgress(
		organizationId,
		projectId,
		existing.milestoneId,
	);

	return activity;
}

export async function bulkUpdateProgress(
	organizationId: string,
	projectId: string,
	updates: Array<{
		activityId: string;
		progress: number;
		status?: ActivityStatus;
	}>,
) {
	// Group by milestone for efficient recalculation
	const milestoneIds = new Set<string>();

	await db.$transaction(async (tx) => {
		for (const update of updates) {
			const existing = await tx.projectActivity.findFirst({
				where: {
					id: update.activityId,
					organizationId,
					projectId,
				},
				select: { milestoneId: true, status: true },
			});

			if (!existing) continue;

			milestoneIds.add(existing.milestoneId);

			const clampedProgress = Math.min(
				100,
				Math.max(0, update.progress),
			);
			let newStatus = update.status ?? existing.status;
			if (!update.status) {
				if (clampedProgress >= 100) newStatus = "COMPLETED";
				else if (
					clampedProgress > 0 &&
					existing.status === "NOT_STARTED"
				)
					newStatus = "IN_PROGRESS";
			}

			await tx.projectActivity.update({
				where: { id: update.activityId },
				data: { progress: clampedProgress, status: newStatus },
			});
		}
	});

	// Recalculate all affected milestones
	for (const milestoneId of milestoneIds) {
		await recalculateMilestoneProgress(
			organizationId,
			projectId,
			milestoneId,
		);
	}
}

// ─── Dependencies ────────────────────────────────────────────────────────

export async function listDependencies(
	organizationId: string,
	projectId: string,
) {
	return db.activityDependency.findMany({
		where: { organizationId, projectId },
		include: {
			predecessor: { select: { id: true, title: true, wbsCode: true } },
			successor: { select: { id: true, title: true, wbsCode: true } },
		},
	});
}

export async function createDependency(
	organizationId: string,
	projectId: string,
	data: {
		predecessorId: string;
		successorId: string;
		dependencyType?: DependencyType;
		lagDays?: number;
	},
) {
	// Check that both activities exist in this project
	const [predecessor, successor] = await Promise.all([
		db.projectActivity.findFirst({
			where: {
				id: data.predecessorId,
				organizationId,
				projectId,
			},
		}),
		db.projectActivity.findFirst({
			where: {
				id: data.successorId,
				organizationId,
				projectId,
			},
		}),
	]);

	if (!predecessor || !successor) {
		throw new Error("Activity not found");
	}

	// Cycle detection
	const hasCycle = await detectCycles(
		organizationId,
		projectId,
		data.predecessorId,
		data.successorId,
	);

	if (hasCycle) {
		throw new Error("Adding this dependency would create a cycle");
	}

	return db.activityDependency.create({
		data: {
			organizationId,
			projectId,
			predecessorId: data.predecessorId,
			successorId: data.successorId,
			dependencyType: data.dependencyType ?? "FINISH_TO_START",
			lagDays: data.lagDays ?? 0,
		},
	});
}

export async function deleteDependency(
	organizationId: string,
	projectId: string,
	dependencyId: string,
) {
	const existing = await db.activityDependency.findFirst({
		where: { id: dependencyId, organizationId, projectId },
	});

	if (!existing) throw new Error("Dependency not found");

	return db.activityDependency.delete({ where: { id: dependencyId } });
}

/**
 * DFS-based cycle detection.
 * Returns true if adding predecessorId→successorId would create a cycle.
 */
export async function detectCycles(
	organizationId: string,
	projectId: string,
	newPredecessorId: string,
	newSuccessorId: string,
): Promise<boolean> {
	// If predecessor === successor, it's a self-loop
	if (newPredecessorId === newSuccessorId) return true;

	// Get all existing dependencies
	const deps = await db.activityDependency.findMany({
		where: { organizationId, projectId },
		select: { predecessorId: true, successorId: true },
	});

	// Build adjacency list
	const adj = new Map<string, string[]>();
	for (const dep of deps) {
		if (!adj.has(dep.predecessorId)) {
			adj.set(dep.predecessorId, []);
		}
		adj.get(dep.predecessorId)!.push(dep.successorId);
	}

	// Add the new edge
	if (!adj.has(newPredecessorId)) {
		adj.set(newPredecessorId, []);
	}
	adj.get(newPredecessorId)!.push(newSuccessorId);

	// DFS from newSuccessorId to see if we can reach newPredecessorId
	const visited = new Set<string>();
	const stack = [newSuccessorId];

	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node === newPredecessorId) return true;
		if (visited.has(node)) continue;
		visited.add(node);

		const neighbors = adj.get(node) ?? [];
		for (const neighbor of neighbors) {
			stack.push(neighbor);
		}
	}

	return false;
}

// ─── Baselines ───────────────────────────────────────────────────────────

export async function listBaselines(
	organizationId: string,
	projectId: string,
) {
	return db.projectBaseline.findMany({
		where: { organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getBaseline(
	organizationId: string,
	projectId: string,
	baselineId: string,
) {
	return db.projectBaseline.findFirst({
		where: { id: baselineId, organizationId, projectId },
		include: {
			createdBy: { select: { id: true, name: true } },
		},
	});
}

export async function createBaseline(
	organizationId: string,
	projectId: string,
	name: string,
	description: string | undefined,
	userId: string,
) {
	// Snapshot milestones + activities
	const milestones = await db.projectMilestone.findMany({
		where: { organizationId, projectId },
		orderBy: { orderIndex: "asc" },
	});

	const activities = await db.projectActivity.findMany({
		where: { organizationId, projectId },
		orderBy: [{ milestoneId: "asc" }, { orderIndex: "asc" }],
	});

	const snapshotData = {
		milestones: milestones.map((m) => ({
			id: m.id,
			title: m.title,
			orderIndex: m.orderIndex,
			plannedStart: m.plannedStart,
			plannedEnd: m.plannedEnd,
			actualStart: m.actualStart,
			actualEnd: m.actualEnd,
			status: m.status,
			progress: m.progress,
		})),
		activities: activities.map((a) => ({
			id: a.id,
			milestoneId: a.milestoneId,
			title: a.title,
			wbsCode: a.wbsCode,
			plannedStart: a.plannedStart,
			plannedEnd: a.plannedEnd,
			actualStart: a.actualStart,
			actualEnd: a.actualEnd,
			status: a.status,
			progress: a.progress,
			duration: a.duration,
		})),
		capturedAt: new Date().toISOString(),
	};

	return db.projectBaseline.create({
		data: {
			organizationId,
			projectId,
			name,
			description,
			snapshotData,
			createdById: userId,
		},
	});
}

export async function setActiveBaseline(
	organizationId: string,
	projectId: string,
	baselineId: string,
) {
	// Atomic: deactivate all, then activate one
	return db.$transaction([
		db.projectBaseline.updateMany({
			where: { organizationId, projectId, isActive: true },
			data: { isActive: false },
		}),
		db.projectBaseline.update({
			where: { id: baselineId },
			data: { isActive: true },
		}),
	]);
}

export async function deleteBaseline(
	organizationId: string,
	projectId: string,
	baselineId: string,
) {
	const existing = await db.projectBaseline.findFirst({
		where: { id: baselineId, organizationId, projectId },
	});

	if (!existing) throw new Error("Baseline not found");

	return db.projectBaseline.delete({ where: { id: baselineId } });
}

// ─── Calendar ────────────────────────────────────────────────────────────

export async function getCalendar(
	organizationId: string,
	projectId: string,
) {
	return db.projectCalendar.findFirst({
		where: { organizationId, projectId, isDefault: true },
	});
}

export async function upsertCalendar(
	organizationId: string,
	projectId: string,
	data: {
		name?: string;
		workDays?: number[];
		holidays?: Array<{ date: string; name: string }>;
		defaultHoursPerDay?: number;
	},
) {
	const existing = await db.projectCalendar.findFirst({
		where: { organizationId, projectId, isDefault: true },
	});

	if (existing) {
		return db.projectCalendar.update({
			where: { id: existing.id },
			data: {
				name: data.name ?? existing.name,
				workDays: data.workDays ?? (existing.workDays as number[]),
				holidays: data.holidays ?? (existing.holidays as any[]),
				defaultHoursPerDay:
					data.defaultHoursPerDay ?? existing.defaultHoursPerDay,
			},
		});
	}

	return db.projectCalendar.create({
		data: {
			organizationId,
			projectId,
			name: data.name ?? "التقويم الافتراضي",
			workDays: data.workDays ?? [0, 1, 2, 3, 4], // Sun-Thu
			holidays: data.holidays ?? [],
			defaultHoursPerDay: data.defaultHoursPerDay ?? 8,
			isDefault: true,
		},
	});
}

// ─── Checklists ──────────────────────────────────────────────────────────

export async function listChecklists(
	organizationId: string,
	activityId: string,
) {
	return db.activityChecklist.findMany({
		where: { organizationId, activityId },
		include: {
			completedBy: { select: { id: true, name: true } },
		},
		orderBy: { orderIndex: "asc" },
	});
}

export async function createChecklistItem(
	organizationId: string,
	activityId: string,
	title: string,
) {
	// Get activity to verify it exists
	const activity = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId },
		select: { id: true },
	});

	if (!activity) throw new Error("Activity not found");

	const lastItem = await db.activityChecklist.findFirst({
		where: { organizationId, activityId },
		orderBy: { orderIndex: "desc" },
		select: { orderIndex: true },
	});

	return db.activityChecklist.create({
		data: {
			organizationId,
			activityId,
			title,
			orderIndex: (lastItem?.orderIndex ?? -1) + 1,
		},
	});
}

export async function toggleChecklistItem(
	organizationId: string,
	activityId: string,
	checklistId: string,
	userId: string,
) {
	const existing = await db.activityChecklist.findFirst({
		where: { id: checklistId, organizationId, activityId },
	});

	if (!existing) throw new Error("Checklist item not found");

	const updated = await db.activityChecklist.update({
		where: { id: checklistId },
		data: {
			isCompleted: !existing.isCompleted,
			completedAt: !existing.isCompleted ? new Date() : null,
			completedById: !existing.isCompleted ? userId : null,
		},
	});

	// If milestone uses CHECKLIST method, recalculate
	const activity = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId },
		select: { milestoneId: true, projectId: true },
	});

	if (activity) {
		await recalculateMilestoneProgress(
			organizationId,
			activity.projectId,
			activity.milestoneId,
		);
	}

	return updated;
}

export async function deleteChecklistItem(
	organizationId: string,
	activityId: string,
	checklistId: string,
) {
	const existing = await db.activityChecklist.findFirst({
		where: { id: checklistId, organizationId, activityId },
	});

	if (!existing) throw new Error("Checklist item not found");

	await db.activityChecklist.delete({ where: { id: checklistId } });

	// Recalculate if needed
	const activity = await db.projectActivity.findFirst({
		where: { id: activityId, organizationId },
		select: { milestoneId: true, projectId: true },
	});

	if (activity) {
		await recalculateMilestoneProgress(
			organizationId,
			activity.projectId,
			activity.milestoneId,
		);
	}
}

export async function reorderChecklist(
	organizationId: string,
	activityId: string,
	checklistIds: string[],
) {
	const updates = checklistIds.map((id, index) =>
		db.activityChecklist.updateMany({
			where: { id, organizationId, activityId },
			data: { orderIndex: index },
		}),
	);

	await db.$transaction(updates);

	return listChecklists(organizationId, activityId);
}

// ─── Analytics ───────────────────────────────────────────────────────────

export async function getExecutionDashboard(
	organizationId: string,
	projectId: string,
) {
	const [activities, milestones] = await Promise.all([
		db.projectActivity.findMany({
			where: { organizationId, projectId },
			select: {
				status: true,
				progress: true,
				plannedEnd: true,
				actualEnd: true,
				plannedStart: true,
			},
		}),
		db.projectMilestone.findMany({
			where: { organizationId, projectId },
			select: {
				status: true,
				progress: true,
				plannedEnd: true,
				plannedStart: true,
				actualEnd: true,
			},
		}),
	]);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const totalActivities = activities.length;
	const completedActivities = activities.filter(
		(a) => a.status === "COMPLETED",
	).length;
	const delayedActivities = activities.filter(
		(a) =>
			a.status !== "COMPLETED" &&
			a.plannedEnd &&
			new Date(a.plannedEnd) < today,
	).length;
	const inProgressActivities = activities.filter(
		(a) => a.status === "IN_PROGRESS",
	).length;

	const totalMilestones = milestones.length;
	const completedMilestones = milestones.filter(
		(m) => m.status === "COMPLETED",
	).length;
	const delayedMilestones = milestones.filter(
		(m) =>
			m.status !== "COMPLETED" &&
			m.plannedEnd &&
			new Date(m.plannedEnd) < today,
	).length;

	const overallProgress =
		totalMilestones > 0
			? Math.round(
					milestones.reduce((sum, m) => sum + m.progress, 0) /
						totalMilestones,
				)
			: 0;

	// Next upcoming milestone
	const upcomingMilestone = milestones
		.filter(
			(m) =>
				m.status !== "COMPLETED" &&
				m.plannedStart &&
				new Date(m.plannedStart) >= today,
		)
		.sort(
			(a, b) =>
				new Date(a.plannedStart!).getTime() -
				new Date(b.plannedStart!).getTime(),
		)[0];

	return {
		activities: {
			total: totalActivities,
			completed: completedActivities,
			delayed: delayedActivities,
			inProgress: inProgressActivities,
		},
		milestones: {
			total: totalMilestones,
			completed: completedMilestones,
			delayed: delayedMilestones,
		},
		overallProgress,
		upcomingMilestone: upcomingMilestone
			? {
					plannedStart: upcomingMilestone.plannedStart,
					daysUntil: Math.ceil(
						(new Date(upcomingMilestone.plannedStart!).getTime() -
							today.getTime()) /
							(1000 * 60 * 60 * 24),
					),
				}
			: null,
	};
}

export async function getActivityGraphForCPM(
	organizationId: string,
	projectId: string,
) {
	const [activities, dependencies] = await Promise.all([
		db.projectActivity.findMany({
			where: { organizationId, projectId },
			select: {
				id: true,
				title: true,
				duration: true,
				plannedStart: true,
				plannedEnd: true,
				status: true,
			},
		}),
		db.activityDependency.findMany({
			where: { organizationId, projectId },
			select: {
				predecessorId: true,
				successorId: true,
				dependencyType: true,
				lagDays: true,
			},
		}),
	]);

	return {
		nodes: activities.map((a) => ({
			id: a.id,
			title: a.title,
			duration: a.duration ?? 0,
			plannedStart: a.plannedStart,
			plannedEnd: a.plannedEnd,
			status: a.status,
		})),
		edges: dependencies.map((d) => ({
			predecessorId: d.predecessorId,
			successorId: d.successorId,
			type: d.dependencyType,
			lag: d.lagDays,
		})),
	};
}

export async function getLookahead(
	organizationId: string,
	projectId: string,
	weeks: number,
) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + weeks * 7);

	return db.projectActivity.findMany({
		where: {
			organizationId,
			projectId,
			status: { not: "COMPLETED" },
			OR: [
				{
					plannedStart: { gte: today, lte: endDate },
				},
				{
					plannedEnd: { gte: today, lte: endDate },
				},
				{
					plannedStart: { lte: today },
					plannedEnd: { gte: today },
				},
			],
		},
		include: {
			milestone: { select: { id: true, title: true } },
			assignee: { select: { id: true, name: true } },
		},
		orderBy: { plannedStart: "asc" },
	});
}

export async function getDelayAnalysis(
	organizationId: string,
	projectId: string,
) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const delayedActivities = await db.projectActivity.findMany({
		where: {
			organizationId,
			projectId,
			status: { not: "COMPLETED" },
			plannedEnd: { lt: today },
		},
		include: {
			milestone: { select: { id: true, title: true } },
			assignee: { select: { id: true, name: true } },
			successorOf: {
				include: {
					predecessor: {
						select: { id: true, title: true, status: true },
					},
				},
			},
		},
		orderBy: { plannedEnd: "asc" },
	});

	return delayedActivities.map((a) => ({
		...a,
		delayDays: Math.ceil(
			(today.getTime() - new Date(a.plannedEnd!).getTime()) /
				(1000 * 60 * 60 * 24),
		),
	}));
}

export async function getPlannedVsActual(
	organizationId: string,
	projectId: string,
	baselineId?: string,
) {
	// Get baseline snapshot if specified
	let baselineData: any = null;
	if (baselineId) {
		const baseline = await db.projectBaseline.findFirst({
			where: { id: baselineId, organizationId, projectId },
			select: { snapshotData: true },
		});
		baselineData = baseline?.snapshotData;
	} else {
		// Use active baseline
		const activeBaseline = await db.projectBaseline.findFirst({
			where: { organizationId, projectId, isActive: true },
			select: { snapshotData: true },
		});
		baselineData = activeBaseline?.snapshotData;
	}

	// Get current data
	const [milestones, activities] = await Promise.all([
		db.projectMilestone.findMany({
			where: { organizationId, projectId },
			orderBy: { orderIndex: "asc" },
			select: {
				id: true,
				title: true,
				plannedStart: true,
				plannedEnd: true,
				actualStart: true,
				actualEnd: true,
				progress: true,
				status: true,
			},
		}),
		db.projectActivity.findMany({
			where: { organizationId, projectId },
			orderBy: [{ milestoneId: "asc" }, { orderIndex: "asc" }],
			select: {
				id: true,
				milestoneId: true,
				title: true,
				plannedStart: true,
				plannedEnd: true,
				actualStart: true,
				actualEnd: true,
				progress: true,
				status: true,
			},
		}),
	]);

	return {
		current: { milestones, activities },
		baseline: baselineData,
	};
}
