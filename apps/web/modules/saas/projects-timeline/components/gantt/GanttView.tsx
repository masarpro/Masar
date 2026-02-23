"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import type { GanttMilestone } from "./types";
import { useGanttState } from "./use-gantt-state";
import { useGanttDrag } from "./use-gantt-drag";
import { GanttToolbar } from "./GanttToolbar";
import { GanttContainer } from "./GanttContainer";

interface GanttViewProps {
	milestones: GanttMilestone[];
	onEditMilestone: (milestone: GanttMilestone) => void;
	onRescheduleMilestone: (milestoneId: string, plannedStart: string, plannedEnd: string) => void;
}

export function GanttView({
	milestones,
	onEditMilestone,
	onRescheduleMilestone,
}: GanttViewProps) {
	const t = useTranslations();
	const containerRef = useRef<HTMLDivElement>(null);

	const {
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
	} = useGanttState(milestones);

	const handleReschedule = useCallback(
		(milestoneId: string, newStart: Date, newEnd: Date) => {
			onRescheduleMilestone(
				milestoneId,
				newStart.toISOString(),
				newEnd.toISOString(),
			);
		},
		[onRescheduleMilestone],
	);

	const { isDragging, handleDragStart } = useGanttDrag({
		milestones: filteredMilestones,
		columnWidth,
		isRtl,
		onReschedule: handleReschedule,
	});

	const handleScrollToToday = useCallback(() => {
		const scrollContainer = containerRef.current?.querySelector("[data-scroll-to-today]");
		if (scrollContainer) {
			const fn = (scrollContainer as HTMLElement).dataset.scrollToToday;
			// Trigger scroll programmatically through the container ref
		}
		// Alternative: use the GanttContainer's built-in scrollToToday
		const chartArea = containerRef.current?.querySelector(".overflow-auto");
		if (chartArea) {
			const todayPx = (() => {
				const now = new Date();
				const dayOffset = Math.round(
					(now.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
				);
				const px = dayOffset * columnWidth;
				return isRtl ? totalWidth - px : px;
			})();
			chartArea.scrollLeft = Math.max(0, todayPx - chartArea.clientWidth / 2);
		}
	}, [dateRange.start, columnWidth, isRtl, totalWidth]);

	const handleMilestoneClick = useCallback(
		(milestone: GanttMilestone) => {
			if (!isDragging) {
				onEditMilestone(milestone);
			}
		},
		[isDragging, onEditMilestone],
	);

	if (milestones.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold mb-2">{t("timeline.emptyTitle")}</h3>
				<p className="text-muted-foreground">{t("timeline.emptyDescription")}</p>
			</div>
		);
	}

	// Check if any milestones have dates
	const hasDateMilestones = milestones.some((m) => m.plannedStart && m.plannedEnd);
	if (!hasDateMilestones) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold mb-2">{t("timeline.gantt.noDates")}</h3>
				<p className="text-muted-foreground">{t("timeline.gantt.noDatesDescription")}</p>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="space-y-3">
			{/* Toolbar */}
			<GanttToolbar
				zoom={zoom}
				onZoomChange={setZoom}
				filters={filters}
				onFiltersChange={setFilters}
				hasActiveFilters={hasActiveFilters}
				onResetFilters={resetFilters}
				onScrollToToday={handleScrollToToday}
			/>

			{/* Legend */}
			<div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-slate-400/30 border border-slate-400" />
					<span>{t("timeline.status.planned")}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-teal-500/30 border border-teal-500" />
					<span>{t("timeline.status.inProgress")}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500" />
					<span>{t("timeline.status.completed")}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500" />
					<span>{t("timeline.status.delayed")}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-orange-500" />
					<span>{t("timeline.gantt.critical")}</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-0.5 bg-red-500" />
					<span>{t("timeline.gantt.todayLine")}</span>
				</div>
			</div>

			{/* Gantt Chart */}
			<GanttContainer
				milestones={filteredMilestones}
				dateRange={dateRange}
				columnWidth={columnWidth}
				totalWidth={totalWidth}
				isRtl={isRtl}
				locale={locale}
				headerIntervals={headerIntervals}
				onMilestoneClick={handleMilestoneClick}
				onDragStart={handleDragStart}
			/>

			{filteredMilestones.length === 0 && hasActiveFilters && (
				<div className="text-center py-8 text-muted-foreground text-sm">
					{t("timeline.gantt.noResults")}
				</div>
			)}
		</div>
	);
}
