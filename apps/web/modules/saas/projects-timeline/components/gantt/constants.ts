import type { ZoomConfig, ZoomLevel, MilestoneStatus, HealthStatus } from "./types";

export const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
	week: {
		columnWidth: 40,
		headerFormat: "week",
		subHeaderFormat: "day",
	},
	month: {
		columnWidth: 14,
		headerFormat: "month",
		subHeaderFormat: "week",
	},
	quarter: {
		columnWidth: 4,
		headerFormat: "month",
		subHeaderFormat: "month",
	},
};

export const ROW_HEIGHT = 52;
export const HEADER_HEIGHT = 56;
export const SIDEBAR_WIDTH = 240;
export const BAR_HEIGHT = 24;
export const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
export const ACTUAL_BAR_HEIGHT = 8;
export const PADDING_DAYS = 7;

export const STATUS_COLORS: Record<MilestoneStatus, { bg: string; border: string; text: string }> = {
	PLANNED: {
		bg: "color-mix(in srgb, var(--muted-foreground) 30%, transparent)",
		border: "var(--muted-foreground)",
		text: "var(--muted-foreground)",
	},
	IN_PROGRESS: {
		bg: "color-mix(in srgb, var(--chart-4) 30%, transparent)",
		border: "var(--chart-4)",
		text: "var(--chart-4)",
	},
	COMPLETED: {
		bg: "color-mix(in srgb, var(--success) 30%, transparent)",
		border: "var(--success)",
		text: "var(--success)",
	},
	DELAYED: {
		bg: "color-mix(in srgb, var(--destructive) 30%, transparent)",
		border: "var(--destructive)",
		text: "var(--destructive)",
	},
};

export const HEALTH_COLORS: Record<HealthStatus, string> = {
	ON_TRACK: "var(--success)",
	AT_RISK: "var(--chart-1)",
	DELAYED: "var(--destructive)",
};

export const TODAY_LINE_COLOR = "var(--destructive)";
export const GRID_LINE_COLOR = "var(--border)";
export const WEEKEND_BG_COLOR = "color-mix(in srgb, var(--muted-foreground) 6%, transparent)";
