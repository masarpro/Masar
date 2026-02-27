"use client";

import { useMemo, useCallback } from "react";
import { useGantt } from "../../../hooks/use-gantt-context";
import {
	GANTT_ROW_HEIGHT,
	GANTT_HEADER_HEIGHT,
	ZOOM_CONFIGS,
	WEEKEND_BG_COLOR,
} from "../../../lib/gantt-constants";
import { GanttTimeHeader } from "./GanttTimeHeader";
import { GanttTodayMarker } from "./GanttTodayMarker";
import { GanttMilestoneGroupBar } from "./GanttMilestoneGroupBar";
import { GanttActivityBar } from "./GanttActivityBar";
import { GanttBaselineOverlay } from "./GanttBaselineOverlay";
import { DependencyLayer } from "../dependencies/DependencyLayer";
import { DependencyDrawLine } from "../dependencies/DependencyDrawLine";
import type { FlatGanttRow, DragType, GanttActivityRow } from "../../../lib/gantt-types";
import { getTimeHeaderIntervals } from "../../../lib/gantt-utils";
import { useLocale } from "next-intl";

interface GanttSvgCanvasProps {
	visibleRows: FlatGanttRow[];
	startIndex: number;
	topPadding: number;
	totalHeight: number;
	isRtl: boolean;
	onDragStart: (
		activityId: string,
		type: DragType,
		e: React.MouseEvent,
		activity: GanttActivityRow,
	) => void;
	onAnchorDragStart?: (
		activityId: string,
		anchor: "start" | "end",
		e: React.MouseEvent,
	) => void;
	isDependencyDragging?: boolean;
	onAnchorHover?: (
		activityId: string | null,
		anchor: "start" | "end" | null,
	) => void;
	onDeleteDependency?: (id: string) => void;
}

export function GanttSvgCanvas({
	visibleRows,
	startIndex,
	topPadding,
	totalHeight,
	isRtl,
	onDragStart,
	onAnchorDragStart,
	isDependencyDragging,
	onAnchorHover,
	onDeleteDependency,
}: GanttSvgCanvasProps) {
	const { state } = useGantt();
	const locale = useLocale();
	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;
	const totalWidth = state.dateRange.totalDays * pixelsPerDay;
	const svgHeight = totalHeight + GANTT_HEADER_HEIGHT;

	// Weekend columns for background shading
	const weekendColumns = useMemo(() => {
		if (state.zoom === "quarter") return []; // too small to show
		const intervals = getTimeHeaderIntervals(state.dateRange, state.zoom, locale);
		return intervals.secondary.filter((s) => s.isWeekend);
	}, [state.dateRange, state.zoom, locale]);

	return (
		<svg
			width={totalWidth}
			height={svgHeight}
			className="select-none"
			style={{ minWidth: totalWidth }}
		>
			{/* Arrow marker definitions */}
			<defs>
				<marker
					id="arrowhead-normal"
					markerWidth="8"
					markerHeight="6"
					refX="8"
					refY="3"
					orient="auto"
				>
					<polygon points="0 0, 8 3, 0 6" fill="#64748b" />
				</marker>
				<marker
					id="arrowhead-critical"
					markerWidth="8"
					markerHeight="6"
					refX="8"
					refY="3"
					orient="auto"
				>
					<polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
				</marker>
			</defs>

			{/* Time header (sticky at top via CSS) */}
			<GanttTimeHeader totalWidth={totalWidth} isRtl={isRtl} />

			{/* Weekend background shading */}
			{weekendColumns.map((col, i) => {
				const x = isRtl ? totalWidth - col.x - col.width : col.x;
				return (
					<rect
						key={`weekend-${i}`}
						x={x}
						y={GANTT_HEADER_HEIGHT}
						width={col.width}
						height={totalHeight}
						fill={WEEKEND_BG_COLOR}
					/>
				);
			})}

			{/* Row grid lines */}
			<g>
				{visibleRows.map((_, idx) => {
					const y =
						GANTT_HEADER_HEIGHT + topPadding + idx * GANTT_ROW_HEIGHT;
					return (
						<line
							key={`grid-${idx}`}
							x1={0}
							y1={y + GANTT_ROW_HEIGHT}
							x2={totalWidth}
							y2={y + GANTT_ROW_HEIGHT}
							stroke="currentColor"
							strokeOpacity={0.05}
						/>
					);
				})}
			</g>

			{/* Content area offset by header */}
			<g transform={`translate(0, ${GANTT_HEADER_HEIGHT})`}>
				{/* Baseline overlay */}
				<GanttBaselineOverlay
					visibleRows={visibleRows}
					startIndex={startIndex}
					totalWidth={totalWidth}
					isRtl={isRtl}
					topPadding={topPadding}
				/>

				{/* Activity and milestone bars */}
				<g transform={`translate(0, ${topPadding})`}>
					{visibleRows.map((flatRow, idx) => {
						const rowIndex = startIndex + idx;
						if (flatRow.row.type === "milestone") {
							return (
								<GanttMilestoneGroupBar
									key={flatRow.row.id}
									milestone={flatRow.row}
									rowIndex={idx}
									totalWidth={totalWidth}
									isRtl={isRtl}
								/>
							);
						}
						return (
							<GanttActivityBar
								key={flatRow.row.id}
								activity={flatRow.row}
								rowIndex={idx}
								totalWidth={totalWidth}
								isRtl={isRtl}
								onDragStart={onDragStart}
								onAnchorDragStart={onAnchorDragStart}
								isDependencyDragging={isDependencyDragging}
								onAnchorHover={onAnchorHover}
							/>
						);
					})}
				</g>

				{/* Dependency arrows */}
				<DependencyLayer
					flatRows={state.flatRows}
					totalWidth={totalWidth}
					isRtl={isRtl}
					onDelete={onDeleteDependency}
				/>

				{/* Dependency creation drag line */}
				{state.dependencyDragState && (
					<DependencyDrawLine
						fromX={state.dependencyDragState.currentX}
						fromY={state.dependencyDragState.currentY}
						toX={state.dependencyDragState.currentX}
						toY={state.dependencyDragState.currentY}
					/>
				)}

				{/* Today marker */}
				<GanttTodayMarker
					totalWidth={totalWidth}
					totalHeight={totalHeight}
					isRtl={isRtl}
				/>
			</g>
		</svg>
	);
}
