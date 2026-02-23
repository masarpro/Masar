"use client";

import { useRef, useCallback, useState, type UIEvent, type MouseEvent } from "react";
import type { GanttMilestone, DateRange } from "./types";
import { SIDEBAR_WIDTH } from "./constants";
import { getTodayPosition } from "./utils";
import { GanttSidebar } from "./GanttSidebar";
import { GanttChart } from "./GanttChart";
import { GanttTooltip } from "./GanttTooltip";

interface GanttContainerProps {
	milestones: GanttMilestone[];
	dateRange: DateRange;
	columnWidth: number;
	totalWidth: number;
	isRtl: boolean;
	locale: string;
	headerIntervals: {
		primary: { label: string; x: number; width: number }[];
		secondary: { label: string; x: number; width: number; isWeekend?: boolean }[];
	};
	onMilestoneClick: (milestone: GanttMilestone) => void;
	onDragStart: (milestoneId: string, type: "move" | "resize-start" | "resize-end", e: MouseEvent) => void;
}

export function GanttContainer({
	milestones,
	dateRange,
	columnWidth,
	totalWidth,
	isRtl,
	locale,
	headerIntervals,
	onMilestoneClick,
	onDragStart,
}: GanttContainerProps) {
	const chartScrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [tooltip, setTooltip] = useState<{
		milestone: GanttMilestone;
		x: number;
		y: number;
	} | null>(null);

	const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop);
	}, []);

	const handleMilestoneHover = useCallback(
		(milestone: GanttMilestone, e: MouseEvent) => {
			setTooltip({
				milestone,
				x: e.clientX,
				y: e.clientY,
			});
		},
		[],
	);

	const handleMilestoneLeave = useCallback(() => {
		setTooltip(null);
	}, []);

	const scrollToToday = useCallback(() => {
		if (!chartScrollRef.current) return;
		const todayX = getTodayPosition(dateRange.start, columnWidth, isRtl, totalWidth);
		const containerWidth = chartScrollRef.current.clientWidth;
		chartScrollRef.current.scrollLeft = todayX - containerWidth / 2;
	}, [dateRange.start, columnWidth, isRtl, totalWidth]);

	return (
		<div className="relative">
			<div className="flex border border-border/30 rounded-xl overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-slate-900/70">
				{/* Sidebar */}
				<GanttSidebar
					milestones={milestones}
					scrollTop={scrollTop}
					onMilestoneClick={onMilestoneClick}
				/>

				{/* Chart area */}
				<div
					ref={chartScrollRef}
					className="flex-1 overflow-auto"
					onScroll={handleScroll}
					data-scroll-to-today=""
				>
					<GanttChart
						milestones={milestones}
						dateRange={dateRange}
						columnWidth={columnWidth}
						totalWidth={totalWidth}
						isRtl={isRtl}
						headerIntervals={headerIntervals}
						onMilestoneHover={handleMilestoneHover}
						onMilestoneLeave={handleMilestoneLeave}
						onMilestoneClick={onMilestoneClick}
						onDragStart={onDragStart}
					/>
				</div>
			</div>

			{/* Tooltip overlay */}
			{tooltip && (
				<GanttTooltip
					milestone={tooltip.milestone}
					x={tooltip.x}
					y={tooltip.y}
					visible={true}
					locale={locale}
				/>
			)}
		</div>
	);
}
