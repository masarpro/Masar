import type { GanttZoomLevel, ZoomConfig } from "./gantt-types";

// ─── Row Dimensions ───
export const GANTT_ROW_HEIGHT = 40;
export const GANTT_HEADER_HEIGHT = 52;
export const GANTT_BAR_HEIGHT = 22;
export const GANTT_BAR_Y_OFFSET = 9;
export const GANTT_MILESTONE_BAR_HEIGHT = 8;
export const GANTT_PADDING_DAYS = 14;
export const GANTT_MIN_BAR_WIDTH = 8;
export const GANTT_DRAG_HANDLE_WIDTH = 6;

// ─── Split Pane ───
export const DEFAULT_SPLIT_RATIO = 0.3;
export const MIN_SPLIT_RATIO = 0.15;
export const MAX_SPLIT_RATIO = 0.6;
export const SPLIT_DIVIDER_WIDTH = 4;

// ─── Virtualization ───
export const OVERSCAN_ROWS = 5;

// ─── Zoom Configs ───
export const ZOOM_CONFIGS: Record<GanttZoomLevel, ZoomConfig> = {
	day: {
		pixelsPerDay: 60,
		headerPrimaryFormat: "d MMM yyyy",
		headerSecondaryFormat: "EEEE",
	},
	week: {
		pixelsPerDay: 30,
		headerPrimaryFormat: "d MMM yyyy",
		headerSecondaryFormat: "d",
	},
	month: {
		pixelsPerDay: 10,
		headerPrimaryFormat: "MMMM yyyy",
		headerSecondaryFormat: "d",
	},
	quarter: {
		pixelsPerDay: 3,
		headerPrimaryFormat: "MMM yyyy",
		headerSecondaryFormat: "MMM",
	},
};

// ─── Status Colors ───
export const STATUS_COLORS: Record<string, string> = {
	NOT_STARTED: "#94a3b8",
	PLANNED: "#94a3b8",
	IN_PROGRESS: "#14b8a6",
	COMPLETED: "#22c55e",
	DELAYED: "#ef4444",
	ON_HOLD: "#f59e0b",
	CANCELLED: "#cbd5e1",
};

export const STATUS_BG_COLORS: Record<string, string> = {
	NOT_STARTED: "#e2e8f0",
	PLANNED: "#e2e8f0",
	IN_PROGRESS: "#ccfbf1",
	COMPLETED: "#dcfce7",
	DELAYED: "#fee2e2",
	ON_HOLD: "#fef3c7",
	CANCELLED: "#f1f5f9",
};

// ─── Special Colors ───
export const CRITICAL_PATH_COLOR = "#ef4444";
export const CRITICAL_PATH_BG = "#fecaca";
export const DEPENDENCY_ARROW_COLOR = "#64748b";
export const BASELINE_GHOST_COLOR = "rgba(100,116,139,0.35)";
export const TODAY_LINE_COLOR = "#ef4444";
export const WEEKEND_BG_COLOR = "rgba(148,163,184,0.08)";

// ─── WBS Table Columns ───
export const WBS_TABLE_COLUMNS = [
	{ key: "wbs", width: 70 },
	{ key: "name", width: 200 },
	{ key: "duration", width: 70 },
	{ key: "start", width: 90 },
	{ key: "end", width: 90 },
	{ key: "progress", width: 60 },
] as const;

export const WBS_TABLE_MIN_WIDTH = WBS_TABLE_COLUMNS.reduce(
	(sum, col) => sum + col.width,
	0,
);
