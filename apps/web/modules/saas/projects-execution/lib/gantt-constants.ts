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
	NOT_STARTED: "var(--muted-foreground)",
	PLANNED: "var(--muted-foreground)",
	IN_PROGRESS: "var(--chart-3)",
	COMPLETED: "var(--success)",
	DELAYED: "var(--destructive)",
	ON_HOLD: "var(--chart-1)",
	CANCELLED: "var(--border)",
};

export const STATUS_BG_COLORS: Record<string, string> = {
	NOT_STARTED: "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
	PLANNED: "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
	IN_PROGRESS: "color-mix(in srgb, var(--chart-3) 15%, transparent)",
	COMPLETED: "color-mix(in srgb, var(--success) 15%, transparent)",
	DELAYED: "color-mix(in srgb, var(--destructive) 15%, transparent)",
	ON_HOLD: "color-mix(in srgb, var(--chart-1) 15%, transparent)",
	CANCELLED: "var(--muted)",
};

// ─── Special Colors ───
export const CRITICAL_PATH_COLOR = "var(--destructive)";
export const CRITICAL_PATH_BG =
	"color-mix(in srgb, var(--destructive) 25%, transparent)";
export const DEPENDENCY_ARROW_COLOR = "var(--muted-foreground)";
export const BASELINE_GHOST_COLOR =
	"color-mix(in srgb, var(--muted-foreground) 35%, transparent)";
export const TODAY_LINE_COLOR = "var(--destructive)";
export const WEEKEND_BG_COLOR =
	"color-mix(in srgb, var(--muted-foreground) 8%, transparent)";

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
