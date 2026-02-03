import { db } from "../client";
import type { MilestoneStatus } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Project Timeline Queries (Phase 10)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Timeline health status types
 */
export type TimelineHealthStatus = "ON_TRACK" | "AT_RISK" | "DELAYED";

export interface TimelineHealth {
	total: number;
	completed: number;
	delayed: number;
	atRisk: number;
	onTrack: number;
	inProgress: number;
	overallProgress: number;
}

/**
 * Calculate milestone health status
 */
function calculateMilestoneHealth(milestone: {
	plannedEnd: Date | null;
	actualEnd: Date | null;
	progress: number;
	status: MilestoneStatus;
}): TimelineHealthStatus {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Completed milestones are on track
	if (milestone.actualEnd || milestone.status === "COMPLETED") {
		return "ON_TRACK";
	}

	// No planned end date - consider on track
	if (!milestone.plannedEnd) {
		return "ON_TRACK";
	}

	const plannedEnd = new Date(milestone.plannedEnd);
	plannedEnd.setHours(0, 0, 0, 0);

	// Delayed: planned end is in the past and not completed
	if (plannedEnd < today) {
		return "DELAYED";
	}

	// At risk: within 7 days of planned end and progress < 80%
	const daysUntilDeadline = Math.ceil(
		(plannedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (daysUntilDeadline <= 7 && milestone.progress < 80) {
		return "AT_RISK";
	}

	return "ON_TRACK";
}

/**
 * List milestones for a project
 */
export async function listMilestones(organizationId: string, projectId: string) {
	const milestones = await db.projectMilestone.findMany({
		where: {
			organizationId,
			projectId,
		},
		orderBy: { orderIndex: "asc" },
	});

	// Add health status to each milestone
	return milestones.map((milestone) => ({
		...milestone,
		healthStatus: calculateMilestoneHealth(milestone),
	}));
}

/**
 * Get a single milestone
 */
export async function getMilestone(
	organizationId: string,
	projectId: string,
	milestoneId: string,
) {
	const milestone = await db.projectMilestone.findFirst({
		where: {
			id: milestoneId,
			organizationId,
			projectId,
		},
	});

	if (!milestone) return null;

	return {
		...milestone,
		healthStatus: calculateMilestoneHealth(milestone),
	};
}

/**
 * Create a new milestone
 */
export async function createMilestone(
	organizationId: string,
	projectId: string,
	data: {
		title: string;
		description?: string;
		orderIndex?: number;
		plannedStart?: Date;
		plannedEnd?: Date;
		isCritical?: boolean;
	},
) {
	// Get the max orderIndex if not provided
	let orderIndex = data.orderIndex;
	if (orderIndex === undefined) {
		const lastMilestone = await db.projectMilestone.findFirst({
			where: { organizationId, projectId },
			orderBy: { orderIndex: "desc" },
			select: { orderIndex: true },
		});
		orderIndex = (lastMilestone?.orderIndex ?? -1) + 1;
	}

	return db.projectMilestone.create({
		data: {
			organizationId,
			projectId,
			title: data.title,
			description: data.description,
			orderIndex,
			plannedStart: data.plannedStart,
			plannedEnd: data.plannedEnd,
			isCritical: data.isCritical ?? false,
			status: "PLANNED",
			progress: 0,
		},
	});
}

/**
 * Update a milestone
 */
export async function updateMilestone(
	organizationId: string,
	projectId: string,
	milestoneId: string,
	data: {
		title?: string;
		description?: string;
		orderIndex?: number;
		plannedStart?: Date;
		plannedEnd?: Date;
		isCritical?: boolean;
		status?: MilestoneStatus;
	},
) {
	// Verify the milestone belongs to the org/project
	const existing = await db.projectMilestone.findFirst({
		where: { id: milestoneId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Milestone not found");
	}

	return db.projectMilestone.update({
		where: { id: milestoneId },
		data,
	});
}

/**
 * Mark actual progress on a milestone
 */
export async function markActual(
	organizationId: string,
	projectId: string,
	milestoneId: string,
	data: {
		actualStart?: Date;
		actualEnd?: Date;
		progress?: number;
	},
) {
	// Verify the milestone belongs to the org/project
	const existing = await db.projectMilestone.findFirst({
		where: { id: milestoneId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Milestone not found");
	}

	// Determine new status based on actual dates
	let newStatus: MilestoneStatus = existing.status;

	if (data.actualEnd) {
		// If actualEnd is set, milestone is completed
		newStatus = "COMPLETED";
	} else if (data.actualStart && existing.status === "PLANNED") {
		// If actualStart is set and was PLANNED, move to IN_PROGRESS
		newStatus = "IN_PROGRESS";
	}

	// Check if delayed
	if (newStatus !== "COMPLETED" && existing.plannedEnd) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const plannedEnd = new Date(existing.plannedEnd);
		plannedEnd.setHours(0, 0, 0, 0);

		if (plannedEnd < today) {
			newStatus = "DELAYED";
		}
	}

	// Update progress if provided
	let progress = existing.progress;
	if (data.progress !== undefined) {
		progress = Math.min(100, Math.max(0, data.progress));
	}

	// If completed, ensure progress is 100
	if (newStatus === "COMPLETED") {
		progress = 100;
	}

	return db.projectMilestone.update({
		where: { id: milestoneId },
		data: {
			actualStart: data.actualStart ?? existing.actualStart,
			actualEnd: data.actualEnd ?? existing.actualEnd,
			progress,
			status: newStatus,
			// Also update legacy fields for compatibility
			actualDate: data.actualEnd ?? existing.actualEnd,
			isCompleted: newStatus === "COMPLETED",
		},
	});
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(
	organizationId: string,
	projectId: string,
	milestoneId: string,
) {
	// Verify the milestone belongs to the org/project
	const existing = await db.projectMilestone.findFirst({
		where: { id: milestoneId, organizationId, projectId },
	});

	if (!existing) {
		throw new Error("Milestone not found");
	}

	return db.projectMilestone.delete({
		where: { id: milestoneId },
	});
}

/**
 * Reorder milestones
 */
export async function reorderMilestones(
	organizationId: string,
	projectId: string,
	milestoneIds: string[],
) {
	// Update each milestone with its new orderIndex
	const updates = milestoneIds.map((id, index) =>
		db.projectMilestone.updateMany({
			where: { id, organizationId, projectId },
			data: { orderIndex: index },
		}),
	);

	await db.$transaction(updates);

	return listMilestones(organizationId, projectId);
}

/**
 * Get timeline health summary for a project
 */
export async function getTimelineHealth(
	organizationId: string,
	projectId: string,
): Promise<TimelineHealth> {
	const milestones = await db.projectMilestone.findMany({
		where: { organizationId, projectId },
		select: {
			status: true,
			progress: true,
			plannedEnd: true,
			actualEnd: true,
		},
	});

	if (milestones.length === 0) {
		return {
			total: 0,
			completed: 0,
			delayed: 0,
			atRisk: 0,
			onTrack: 0,
			inProgress: 0,
			overallProgress: 0,
		};
	}

	let completed = 0;
	let delayed = 0;
	let atRisk = 0;
	let onTrack = 0;
	let inProgress = 0;
	let totalProgress = 0;

	for (const milestone of milestones) {
		const healthStatus = calculateMilestoneHealth(milestone);
		totalProgress += milestone.progress;

		if (milestone.status === "COMPLETED") {
			completed++;
		} else if (milestone.status === "IN_PROGRESS") {
			inProgress++;
		}

		switch (healthStatus) {
			case "DELAYED":
				delayed++;
				break;
			case "AT_RISK":
				atRisk++;
				break;
			case "ON_TRACK":
				onTrack++;
				break;
		}
	}

	return {
		total: milestones.length,
		completed,
		delayed,
		atRisk,
		onTrack,
		inProgress,
		overallProgress: Math.round(totalProgress / milestones.length),
	};
}
