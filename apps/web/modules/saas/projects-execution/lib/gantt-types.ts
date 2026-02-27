// ─── Gantt Chart Types ───

export type GanttZoomLevel = "day" | "week" | "month" | "quarter";

export type DependencyType =
	| "FINISH_TO_START"
	| "START_TO_START"
	| "FINISH_TO_FINISH"
	| "START_TO_FINISH";

export type ActivityStatus =
	| "NOT_STARTED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "DELAYED"
	| "ON_HOLD"
	| "CANCELLED";

export type MilestoneStatus =
	| "PLANNED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "DELAYED"
	| "CANCELLED";

// ─── Row Types ───

export interface GanttMilestoneRow {
	type: "milestone";
	id: string;
	title: string;
	orderIndex: number;
	plannedStart: Date | null;
	plannedEnd: Date | null;
	actualStart: Date | null;
	actualEnd: Date | null;
	status: MilestoneStatus;
	progress: number;
	isCritical: boolean;
	children: GanttActivityRow[];
}

export interface GanttActivityRow {
	type: "activity";
	id: string;
	milestoneId: string;
	title: string;
	wbsCode: string | null;
	plannedStart: Date | null;
	plannedEnd: Date | null;
	duration: number | null;
	actualStart: Date | null;
	actualEnd: Date | null;
	status: ActivityStatus;
	progress: number;
	isCritical: boolean;
	orderIndex: number;
	assignee?: { id: string; name: string; image?: string | null } | null;
}

export type GanttRow = GanttMilestoneRow | GanttActivityRow;

export interface FlatGanttRow {
	row: GanttRow;
	depth: number;
	index: number;
}

// ─── Dependencies ───

export interface GanttDependency {
	id: string;
	predecessorId: string;
	successorId: string;
	type: DependencyType;
	lag: number;
}

// ─── Baseline ───

export interface BaselineSnapshot {
	id: string;
	name: string;
	activities: Array<{
		activityId: string;
		plannedStart: Date | null;
		plannedEnd: Date | null;
		duration: number | null;
	}>;
}

// ─── Drag State ───

export type DragType = "move" | "resize-start" | "resize-end";

export interface GanttDragState {
	activityId: string;
	type: DragType;
	startX: number;
	originalStart: Date;
	originalEnd: Date;
	currentDeltaDays: number;
}

export interface DependencyDragState {
	sourceActivityId: string;
	sourceAnchor: "start" | "end";
	currentX: number;
	currentY: number;
	targetActivityId: string | null;
	targetAnchor: "start" | "end" | null;
}

// ─── Date Range ───

export interface GanttDateRange {
	start: Date;
	end: Date;
	totalDays: number;
}

// ─── Zoom Config ───

export interface ZoomConfig {
	pixelsPerDay: number;
	headerPrimaryFormat: string;
	headerSecondaryFormat: string;
}

// ─── Context State ───

export interface GanttState {
	zoom: GanttZoomLevel;
	dateRange: GanttDateRange;
	rows: GanttMilestoneRow[];
	flatRows: FlatGanttRow[];
	dependencies: GanttDependency[];
	criticalActivityIds: Set<string>;
	collapsedMilestones: Set<string>;
	selectedActivityId: string | null;
	hoveredActivityId: string | null;
	dragState: GanttDragState | null;
	dependencyDragState: DependencyDragState | null;
	splitPaneRatio: number;
	showBaseline: boolean;
	activeBaselineId: string | null;
	baselineData: BaselineSnapshot | null;
	scrollTop: number;
	scrollLeft: number;
}

// ─── Reducer Actions ───

export type GanttAction =
	| { type: "SET_ZOOM"; zoom: GanttZoomLevel }
	| { type: "SET_DATE_RANGE"; dateRange: GanttDateRange }
	| { type: "SET_ROWS"; rows: GanttMilestoneRow[] }
	| { type: "SET_DEPENDENCIES"; dependencies: GanttDependency[] }
	| { type: "SET_CRITICAL_IDS"; ids: Set<string> }
	| { type: "TOGGLE_COLLAPSE"; milestoneId: string }
	| { type: "EXPAND_ALL" }
	| { type: "COLLAPSE_ALL" }
	| { type: "SELECT_ACTIVITY"; activityId: string | null }
	| { type: "HOVER_ACTIVITY"; activityId: string | null }
	| { type: "SET_DRAG_STATE"; dragState: GanttDragState | null }
	| { type: "UPDATE_DRAG_DELTA"; deltaDays: number }
	| { type: "SET_DEPENDENCY_DRAG"; state: DependencyDragState | null }
	| { type: "UPDATE_DEPENDENCY_DRAG_POS"; x: number; y: number }
	| {
			type: "SET_DEPENDENCY_DRAG_TARGET";
			targetActivityId: string | null;
			targetAnchor: "start" | "end" | null;
	  }
	| { type: "SET_SPLIT_RATIO"; ratio: number }
	| { type: "SET_SHOW_BASELINE"; show: boolean }
	| { type: "SET_BASELINE_DATA"; data: BaselineSnapshot | null; id: string | null }
	| { type: "SET_SCROLL_TOP"; scrollTop: number }
	| { type: "SET_SCROLL_LEFT"; scrollLeft: number }
	| {
			type: "OPTIMISTIC_MOVE_ACTIVITY";
			activityId: string;
			newStart: Date;
			newEnd: Date;
	  }
	| {
			type: "OPTIMISTIC_RESIZE_ACTIVITY";
			activityId: string;
			newStart: Date;
			newEnd: Date;
	  };
