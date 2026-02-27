import {
	differenceInDays,
	addDays,
	startOfDay,
	endOfWeek,
	endOfMonth,
	eachDayOfInterval,
	eachWeekOfInterval,
	eachMonthOfInterval,
	format,
	isWeekend,
	isSameDay,
} from "date-fns";
import { ar } from "date-fns/locale";
import type {
	GanttDateRange,
	GanttMilestoneRow,
	GanttActivityRow,
	GanttRow,
	FlatGanttRow,
	GanttZoomLevel,
} from "./gantt-types";
import {
	GANTT_PADDING_DAYS,
	GANTT_ROW_HEIGHT,
	GANTT_BAR_HEIGHT,
	GANTT_BAR_Y_OFFSET,
	GANTT_MIN_BAR_WIDTH,
	ZOOM_CONFIGS,
} from "./gantt-constants";

// ─── Date Helpers ───

function toDate(d: Date | string | null | undefined): Date | null {
	if (!d) return null;
	return typeof d === "string" ? new Date(d) : d;
}

export function safeDate(d: Date | string | null | undefined): Date | null {
	return toDate(d);
}

// ─── Date Range Computation ───

export function computeGanttDateRange(
	milestones: GanttMilestoneRow[],
): GanttDateRange {
	const now = new Date();
	let earliest = now;
	let latest = now;

	for (const m of milestones) {
		const allDates = [m.plannedStart, m.plannedEnd, m.actualStart, m.actualEnd];
		for (const child of m.children) {
			allDates.push(
				child.plannedStart,
				child.plannedEnd,
				child.actualStart,
				child.actualEnd,
			);
		}

		for (const d of allDates) {
			if (!d) continue;
			if (d < earliest) earliest = d;
			if (d > latest) latest = d;
		}
	}

	const start = addDays(startOfDay(earliest), -GANTT_PADDING_DAYS);
	const end = addDays(startOfDay(latest), GANTT_PADDING_DAYS);
	const totalDays = differenceInDays(end, start) + 1;

	return { start, end, totalDays };
}

// ─── RTL-aware Coordinate Conversions ───

export function dateToPx(
	date: Date | string,
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
): number {
	const d = typeof date === "string" ? new Date(date) : date;
	const dayOffset = differenceInDays(startOfDay(d), startOfDay(rangeStart));
	const px = dayOffset * pixelsPerDay;
	return isRtl ? totalWidth - px : px;
}

export function pxToDate(
	px: number,
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
): Date {
	const effectivePx = isRtl ? totalWidth - px : px;
	const dayOffset = Math.round(effectivePx / pixelsPerDay);
	return addDays(startOfDay(rangeStart), dayOffset);
}

// ─── Bar Positioning ───

export function computeActivityBarPosition(
	activity: GanttActivityRow,
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
	rowIndex: number,
): { x: number; width: number; y: number } | null {
	const start = activity.plannedStart;
	const end = activity.plannedEnd;
	if (!start || !end) return null;

	const x1 = dateToPx(start, rangeStart, pixelsPerDay, isRtl, totalWidth);
	const x2 = dateToPx(end, rangeStart, pixelsPerDay, isRtl, totalWidth);

	const x = Math.min(x1, x2);
	const width = Math.max(Math.abs(x2 - x1), GANTT_MIN_BAR_WIDTH);
	const y = rowIndex * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET;

	return { x, width, y };
}

export function computeMilestoneBarPosition(
	milestone: GanttMilestoneRow,
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
	rowIndex: number,
): { x: number; width: number; y: number } | null {
	// Milestone bar spans from earliest child start to latest child end
	let earliest: Date | null = null;
	let latest: Date | null = null;

	if (milestone.plannedStart) {
		earliest = milestone.plannedStart;
	}
	if (milestone.plannedEnd) {
		latest = milestone.plannedEnd;
	}

	for (const child of milestone.children) {
		if (child.plannedStart) {
			if (!earliest || child.plannedStart < earliest)
				earliest = child.plannedStart;
		}
		if (child.plannedEnd) {
			if (!latest || child.plannedEnd > latest) latest = child.plannedEnd;
		}
	}

	if (!earliest || !latest) return null;

	const x1 = dateToPx(earliest, rangeStart, pixelsPerDay, isRtl, totalWidth);
	const x2 = dateToPx(latest, rangeStart, pixelsPerDay, isRtl, totalWidth);

	const x = Math.min(x1, x2);
	const width = Math.max(Math.abs(x2 - x1), GANTT_MIN_BAR_WIDTH);
	const y = rowIndex * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET + 7; // centered lower

	return { x, width, y };
}

// ─── Flatten Rows ───

export function flattenRows(
	milestones: GanttMilestoneRow[],
	collapsedMilestones: Set<string>,
): FlatGanttRow[] {
	const result: FlatGanttRow[] = [];
	let index = 0;

	for (const milestone of milestones) {
		result.push({ row: milestone, depth: 0, index });
		index++;

		if (!collapsedMilestones.has(milestone.id)) {
			for (const activity of milestone.children) {
				result.push({ row: activity, depth: 1, index });
				index++;
			}
		}
	}

	return result;
}

// ─── Today Position ───

export function getTodayPosition(
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
): number {
	return dateToPx(new Date(), rangeStart, pixelsPerDay, isRtl, totalWidth);
}

// ─── Time Header Intervals ───

export interface TimeHeaderInterval {
	label: string;
	x: number;
	width: number;
	isWeekend?: boolean;
	isToday?: boolean;
}

export function getTimeHeaderIntervals(
	range: GanttDateRange,
	zoom: GanttZoomLevel,
	locale: string,
): {
	primary: TimeHeaderInterval[];
	secondary: TimeHeaderInterval[];
} {
	const config = ZOOM_CONFIGS[zoom];
	const isAr = locale === "ar";
	const dateFnsLocale = isAr ? { locale: ar } : undefined;
	const today = startOfDay(new Date());

	const primary: TimeHeaderInterval[] = [];
	const secondary: TimeHeaderInterval[] = [];

	if (zoom === "day" || zoom === "week") {
		// Primary: weeks, Secondary: days
		const weeks = eachWeekOfInterval(
			{ start: range.start, end: range.end },
			{ weekStartsOn: 6 },
		);
		for (const weekStart of weeks) {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 6 });
			const clampedStart =
				weekStart < range.start ? range.start : weekStart;
			const clampedEnd = weekEnd > range.end ? range.end : weekEnd;
			const x =
				differenceInDays(clampedStart, range.start) * config.pixelsPerDay;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.pixelsPerDay;
			primary.push({
				label: format(clampedStart, "d MMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		const days = eachDayOfInterval({ start: range.start, end: range.end });
		for (const day of days) {
			const x = differenceInDays(day, range.start) * config.pixelsPerDay;
			secondary.push({
				label:
					zoom === "day"
						? format(day, "EEE d", dateFnsLocale)
						: format(day, "d", dateFnsLocale),
				x,
				width: config.pixelsPerDay,
				isWeekend: isWeekend(day),
				isToday: isSameDay(day, today),
			});
		}
	} else if (zoom === "month") {
		// Primary: months, Secondary: weeks
		const months = eachMonthOfInterval({
			start: range.start,
			end: range.end,
		});
		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart =
				monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x =
				differenceInDays(clampedStart, range.start) * config.pixelsPerDay;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.pixelsPerDay;
			primary.push({
				label: format(clampedStart, "MMMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		const weeks = eachWeekOfInterval(
			{ start: range.start, end: range.end },
			{ weekStartsOn: 6 },
		);
		for (const weekStart of weeks) {
			const clampedStart =
				weekStart < range.start ? range.start : weekStart;
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 6 });
			const clampedEnd = weekEnd > range.end ? range.end : weekEnd;
			const x =
				differenceInDays(clampedStart, range.start) * config.pixelsPerDay;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.pixelsPerDay;
			secondary.push({
				label: format(clampedStart, "d", dateFnsLocale),
				x,
				width,
			});
		}
	} else {
		// quarter: Primary: months, Secondary: months
		const months = eachMonthOfInterval({
			start: range.start,
			end: range.end,
		});
		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart =
				monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x =
				differenceInDays(clampedStart, range.start) * config.pixelsPerDay;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.pixelsPerDay;
			primary.push({
				label: format(clampedStart, "MMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart =
				monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x =
				differenceInDays(clampedStart, range.start) * config.pixelsPerDay;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.pixelsPerDay;
			secondary.push({
				label: format(clampedStart, "MMM", dateFnsLocale),
				x,
				width,
			});
		}
	}

	return { primary, secondary };
}

// ─── Date Formatting ───

export function formatDateShort(
	date: Date | string | null | undefined,
	locale: string,
): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	const isAr = locale === "ar";
	return format(d, "d MMM", isAr ? { locale: ar } : undefined);
}

export function formatDateFull(
	date: Date | string | null | undefined,
	locale: string,
): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	const isAr = locale === "ar";
	return format(d, "d MMMM yyyy", isAr ? { locale: ar } : undefined);
}

// ─── Snap to Day ───

export function snapToDay(deltaPx: number, pixelsPerDay: number): number {
	return Math.round(deltaPx / pixelsPerDay) * pixelsPerDay;
}

// ─── Activity Anchor Points for Dependency Drawing ───

export function getActivityAnchorPoint(
	activity: GanttActivityRow,
	anchor: "start" | "end",
	rangeStart: Date,
	pixelsPerDay: number,
	isRtl: boolean,
	totalWidth: number,
	rowIndex: number,
): { x: number; y: number } | null {
	if (!activity.plannedStart || !activity.plannedEnd) return null;

	const startPx = dateToPx(
		activity.plannedStart,
		rangeStart,
		pixelsPerDay,
		isRtl,
		totalWidth,
	);
	const endPx = dateToPx(
		activity.plannedEnd,
		rangeStart,
		pixelsPerDay,
		isRtl,
		totalWidth,
	);

	const y = rowIndex * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET + GANTT_BAR_HEIGHT / 2;

	if (anchor === "start") {
		return { x: Math.min(startPx, endPx), y };
	}
	return { x: Math.max(startPx, endPx), y };
}

// ─── Duration in days ───

export function getDurationDays(
	start: Date | string | null,
	end: Date | string | null,
): number | null {
	const s = toDate(start);
	const e = toDate(end);
	if (!s || !e) return null;
	return differenceInDays(startOfDay(e), startOfDay(s));
}
