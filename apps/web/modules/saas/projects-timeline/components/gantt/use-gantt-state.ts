"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import type { GanttMilestone, ZoomLevel, GanttFilters, DateRange } from "./types";
import { ZOOM_CONFIGS } from "./constants";
import { computeDateRange, filterMilestones, getTimeHeaderIntervals } from "./utils";

const DEFAULT_FILTERS: GanttFilters = {
	status: "ALL",
	health: "ALL",
	criticalOnly: false,
};

export function useGanttState(milestones: GanttMilestone[]) {
	const locale = useLocale();
	const isRtl = locale === "ar";

	const [zoom, setZoom] = useState<ZoomLevel>("month");
	const [filters, setFilters] = useState<GanttFilters>(DEFAULT_FILTERS);

	const columnWidth = ZOOM_CONFIGS[zoom].columnWidth;

	const dateRange: DateRange = useMemo(
		() => computeDateRange(milestones),
		[milestones],
	);

	const totalWidth = dateRange.totalDays * columnWidth;

	const filteredMilestones = useMemo(
		() => filterMilestones(milestones, filters),
		[milestones, filters],
	);

	const headerIntervals = useMemo(
		() => getTimeHeaderIntervals(dateRange, zoom, locale),
		[dateRange, zoom, locale],
	);

	const resetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
	}, []);

	const hasActiveFilters = filters.status !== "ALL" || filters.health !== "ALL" || filters.criticalOnly;

	return {
		locale,
		isRtl,
		zoom,
		setZoom,
		filters,
		setFilters,
		resetFilters,
		hasActiveFilters,
		dateRange,
		totalWidth,
		columnWidth,
		filteredMilestones,
		headerIntervals,
	};
}
