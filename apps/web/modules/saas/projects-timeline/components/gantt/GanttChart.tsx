"use client";

import { type MouseEvent } from "react";
import type { GanttMilestone, DateRange } from "./types";
import { HEADER_HEIGHT, ROW_HEIGHT } from "./constants";
import { getTodayPosition } from "./utils";
import { GanttTimeHeader } from "./GanttTimeHeader";
import { GanttTodayMarker } from "./GanttTodayMarker";
import { GanttRow } from "./GanttRow";

interface GanttChartProps {
	milestones: GanttMilestone[];
	dateRange: DateRange;
	columnWidth: number;
	totalWidth: number;
	isRtl: boolean;
	headerIntervals: {
		primary: { label: string; x: number; width: number }[];
		secondary: { label: string; x: number; width: number; isWeekend?: boolean }[];
	};
	onMilestoneHover: (milestone: GanttMilestone, e: MouseEvent) => void;
	onMilestoneLeave: () => void;
	onMilestoneClick: (milestone: GanttMilestone) => void;
	onDragStart: (milestoneId: string, type: "move" | "resize-start" | "resize-end", e: MouseEvent) => void;
}

export function GanttChart({
	milestones,
	dateRange,
	columnWidth,
	totalWidth,
	isRtl,
	headerIntervals,
	onMilestoneHover,
	onMilestoneLeave,
	onMilestoneClick,
	onDragStart,
}: GanttChartProps) {
	const totalHeight = HEADER_HEIGHT + milestones.length * ROW_HEIGHT;
	const todayX = getTodayPosition(dateRange.start, columnWidth, isRtl, totalWidth);

	return (
		<svg
			width={totalWidth}
			height={totalHeight}
			className="select-none"
			direction={isRtl ? "rtl" : "ltr"}
		>
			{/* Time header & grid */}
			<GanttTimeHeader
				primary={headerIntervals.primary}
				secondary={headerIntervals.secondary}
				totalWidth={totalWidth}
				totalHeight={totalHeight}
				isRtl={isRtl}
			/>

			{/* Milestone rows - offset by header */}
			<g transform={`translate(0, ${HEADER_HEIGHT})`}>
				{milestones.map((milestone, index) => (
					<GanttRow
						key={milestone.id}
						milestone={milestone}
						rowIndex={index}
						rangeStart={dateRange.start}
						columnWidth={columnWidth}
						isRtl={isRtl}
						totalWidth={totalWidth}
						onMouseEnter={onMilestoneHover}
						onMouseLeave={onMilestoneLeave}
						onClick={onMilestoneClick}
						onDragStart={onDragStart}
					/>
				))}
			</g>

			{/* Today marker */}
			<GanttTodayMarker x={todayX} totalHeight={totalHeight} />
		</svg>
	);
}
