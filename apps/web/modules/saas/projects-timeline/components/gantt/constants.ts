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
		bg: "rgba(148, 163, 184, 0.3)",
		border: "rgb(148, 163, 184)",
		text: "rgb(100, 116, 139)",
	},
	IN_PROGRESS: {
		bg: "rgba(20, 184, 166, 0.3)",
		border: "rgb(20, 184, 166)",
		text: "rgb(13, 148, 136)",
	},
	COMPLETED: {
		bg: "rgba(34, 197, 94, 0.3)",
		border: "rgb(34, 197, 94)",
		text: "rgb(22, 163, 74)",
	},
	DELAYED: {
		bg: "rgba(239, 68, 68, 0.3)",
		border: "rgb(239, 68, 68)",
		text: "rgb(220, 38, 38)",
	},
};

export const HEALTH_COLORS: Record<HealthStatus, string> = {
	ON_TRACK: "rgb(34, 197, 94)",
	AT_RISK: "rgb(245, 158, 11)",
	DELAYED: "rgb(239, 68, 68)",
};

export const TODAY_LINE_COLOR = "rgb(239, 68, 68)";
export const GRID_LINE_COLOR = "rgba(148, 163, 184, 0.15)";
export const WEEKEND_BG_COLOR = "rgba(148, 163, 184, 0.06)";
