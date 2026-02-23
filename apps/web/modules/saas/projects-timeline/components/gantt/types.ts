export type MilestoneStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
export type HealthStatus = "ON_TRACK" | "AT_RISK" | "DELAYED";

export interface GanttMilestone {
	id: string;
	title: string;
	description?: string | null;
	orderIndex: number;
	plannedStart?: Date | string | null;
	plannedEnd?: Date | string | null;
	actualStart?: Date | string | null;
	actualEnd?: Date | string | null;
	status: MilestoneStatus;
	progress: number;
	isCritical: boolean;
	healthStatus: HealthStatus;
}

export type ZoomLevel = "week" | "month" | "quarter";

export interface ZoomConfig {
	columnWidth: number; // px per day
	headerFormat: "day" | "week" | "month";
	subHeaderFormat: "day" | "week" | "month";
}

export type StatusFilter = MilestoneStatus | "ALL";
export type HealthFilter = HealthStatus | "ALL";

export interface GanttFilters {
	status: StatusFilter;
	health: HealthFilter;
	criticalOnly: boolean;
}

export interface DateRange {
	start: Date;
	end: Date;
	totalDays: number;
}

export interface BarPosition {
	x: number;
	width: number;
	y: number;
}

export interface DragState {
	milestoneId: string;
	type: "move" | "resize-start" | "resize-end";
	startX: number;
	originalStart: Date;
	originalEnd: Date;
	currentDeltaDays: number;
}
