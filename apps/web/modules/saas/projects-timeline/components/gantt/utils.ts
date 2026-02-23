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
} from "date-fns";
import { ar } from "date-fns/locale";
import type { GanttMilestone, DateRange, ZoomLevel, GanttFilters, BarPosition } from "./types";
import { ZOOM_CONFIGS, ROW_HEIGHT, BAR_HEIGHT, BAR_Y_OFFSET, PADDING_DAYS } from "./constants";

function toDate(d: Date | string | null | undefined): Date | null {
	if (!d) return null;
	return typeof d === "string" ? new Date(d) : d;
}

export function computeDateRange(milestones: GanttMilestone[]): DateRange {
	const now = new Date();
	let earliest = now;
	let latest = now;

	for (const m of milestones) {
		const dates = [m.plannedStart, m.plannedEnd, m.actualStart, m.actualEnd]
			.map(toDate)
			.filter((d): d is Date => d !== null);

		for (const d of dates) {
			if (d < earliest) earliest = d;
			if (d > latest) latest = d;
		}
	}

	const start = addDays(startOfDay(earliest), -PADDING_DAYS);
	const end = addDays(startOfDay(latest), PADDING_DAYS);
	const totalDays = differenceInDays(end, start) + 1;

	return { start, end, totalDays };
}

export function dateToPx(
	date: Date | string,
	rangeStart: Date,
	columnWidth: number,
	isRtl: boolean,
	totalWidth: number,
): number {
	const d = typeof date === "string" ? new Date(date) : date;
	const dayOffset = differenceInDays(startOfDay(d), startOfDay(rangeStart));
	const px = dayOffset * columnWidth;
	return isRtl ? totalWidth - px : px;
}

export function pxToDate(
	px: number,
	rangeStart: Date,
	columnWidth: number,
	isRtl: boolean,
	totalWidth: number,
): Date {
	const effectivePx = isRtl ? totalWidth - px : px;
	const dayOffset = Math.round(effectivePx / columnWidth);
	return addDays(startOfDay(rangeStart), dayOffset);
}

export function computeBarPosition(
	milestone: GanttMilestone,
	rangeStart: Date,
	columnWidth: number,
	isRtl: boolean,
	totalWidth: number,
	rowIndex: number,
): BarPosition | null {
	const start = toDate(milestone.plannedStart);
	const end = toDate(milestone.plannedEnd);
	if (!start || !end) return null;

	const x1 = dateToPx(start, rangeStart, columnWidth, isRtl, totalWidth);
	const x2 = dateToPx(end, rangeStart, columnWidth, isRtl, totalWidth);

	const x = Math.min(x1, x2);
	const width = Math.max(Math.abs(x2 - x1), columnWidth);
	const y = rowIndex * ROW_HEIGHT + BAR_Y_OFFSET;

	return { x, width, y };
}

export function computeActualBarPosition(
	milestone: GanttMilestone,
	rangeStart: Date,
	columnWidth: number,
	isRtl: boolean,
	totalWidth: number,
	rowIndex: number,
): BarPosition | null {
	const start = toDate(milestone.actualStart);
	const end = toDate(milestone.actualEnd) ?? new Date();
	if (!start) return null;

	const x1 = dateToPx(start, rangeStart, columnWidth, isRtl, totalWidth);
	const x2 = dateToPx(end, rangeStart, columnWidth, isRtl, totalWidth);

	const x = Math.min(x1, x2);
	const width = Math.max(Math.abs(x2 - x1), columnWidth);
	const y = rowIndex * ROW_HEIGHT + BAR_Y_OFFSET + BAR_HEIGHT - 8;

	return { x, width, y };
}

export function getTimeHeaderIntervals(
	range: DateRange,
	zoom: ZoomLevel,
	locale: string,
): { primary: { label: string; x: number; width: number }[]; secondary: { label: string; x: number; width: number; isWeekend?: boolean }[] } {
	const config = ZOOM_CONFIGS[zoom];
	const isAr = locale === "ar";
	const dateFnsLocale = isAr ? { locale: ar } : undefined;

	const primary: { label: string; x: number; width: number }[] = [];
	const secondary: { label: string; x: number; width: number; isWeekend?: boolean }[] = [];

	if (zoom === "week") {
		// Primary: weeks, Secondary: days
		const weeks = eachWeekOfInterval({ start: range.start, end: range.end }, { weekStartsOn: 6 });
		for (const weekStart of weeks) {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 6 });
			const x = differenceInDays(weekStart < range.start ? range.start : weekStart, range.start) * config.columnWidth;
			const clampedEnd = weekEnd > range.end ? range.end : weekEnd;
			const days = differenceInDays(clampedEnd, weekStart < range.start ? range.start : weekStart) + 1;
			const width = days * config.columnWidth;
			primary.push({
				label: format(weekStart < range.start ? range.start : weekStart, "d MMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		const days = eachDayOfInterval({ start: range.start, end: range.end });
		for (const day of days) {
			const x = differenceInDays(day, range.start) * config.columnWidth;
			secondary.push({
				label: format(day, "d", dateFnsLocale),
				x,
				width: config.columnWidth,
				isWeekend: isWeekend(day),
			});
		}
	} else if (zoom === "month") {
		// Primary: months, Secondary: weeks
		const months = eachMonthOfInterval({ start: range.start, end: range.end });
		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart = monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x = differenceInDays(clampedStart, range.start) * config.columnWidth;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.columnWidth;
			primary.push({
				label: format(clampedStart, "MMMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		const weeks = eachWeekOfInterval({ start: range.start, end: range.end }, { weekStartsOn: 6 });
		for (const weekStart of weeks) {
			const clampedStart = weekStart < range.start ? range.start : weekStart;
			const x = differenceInDays(clampedStart, range.start) * config.columnWidth;
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 6 });
			const clampedEnd = weekEnd > range.end ? range.end : weekEnd;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.columnWidth;
			secondary.push({
				label: format(clampedStart, "d", dateFnsLocale),
				x,
				width,
			});
		}
	} else {
		// quarter: Primary: months, Secondary: months (same)
		const months = eachMonthOfInterval({ start: range.start, end: range.end });
		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart = monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x = differenceInDays(clampedStart, range.start) * config.columnWidth;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.columnWidth;
			primary.push({
				label: format(clampedStart, "MMM yyyy", dateFnsLocale),
				x,
				width,
			});
		}

		// Use same months for secondary level
		for (const monthStart of months) {
			const monthEnd = endOfMonth(monthStart);
			const clampedStart = monthStart < range.start ? range.start : monthStart;
			const clampedEnd = monthEnd > range.end ? range.end : monthEnd;
			const x = differenceInDays(clampedStart, range.start) * config.columnWidth;
			const days = differenceInDays(clampedEnd, clampedStart) + 1;
			const width = days * config.columnWidth;
			secondary.push({
				label: format(clampedStart, "MMM", dateFnsLocale),
				x,
				width,
			});
		}
	}

	return { primary, secondary };
}

export function filterMilestones(milestones: GanttMilestone[], filters: GanttFilters): GanttMilestone[] {
	return milestones.filter((m) => {
		if (filters.status !== "ALL" && m.status !== filters.status) return false;
		if (filters.health !== "ALL" && m.healthStatus !== filters.health) return false;
		if (filters.criticalOnly && !m.isCritical) return false;
		return true;
	});
}

export function formatDateShort(date: Date | string | null | undefined, locale: string): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	const isAr = locale === "ar";
	return format(d, "d MMM", isAr ? { locale: ar } : undefined);
}

export function formatDateFull(date: Date | string | null | undefined, locale: string): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	const isAr = locale === "ar";
	return format(d, "d MMMM yyyy", isAr ? { locale: ar } : undefined);
}

export function snapToDay(deltaPx: number, columnWidth: number): number {
	return Math.round(deltaPx / columnWidth) * columnWidth;
}

export function getTodayPosition(rangeStart: Date, columnWidth: number, isRtl: boolean, totalWidth: number): number {
	return dateToPx(new Date(), rangeStart, columnWidth, isRtl, totalWidth);
}
