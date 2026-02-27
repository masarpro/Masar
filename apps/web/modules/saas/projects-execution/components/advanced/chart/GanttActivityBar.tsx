"use client";

import { memo, useMemo, useState, useCallback } from "react";
import type { GanttActivityRow, DragType } from "../../../lib/gantt-types";
import {
	GANTT_BAR_HEIGHT,
	GANTT_DRAG_HANDLE_WIDTH,
	GANTT_MIN_BAR_WIDTH,
	STATUS_COLORS,
	STATUS_BG_COLORS,
	CRITICAL_PATH_COLOR,
	CRITICAL_PATH_BG,
	ZOOM_CONFIGS,
} from "../../../lib/gantt-constants";
import { computeActivityBarPosition } from "../../../lib/gantt-utils";
import { useGantt } from "../../../hooks/use-gantt-context";
import { GanttBarTooltip } from "./GanttBarTooltip";
import { addDays } from "date-fns";

interface GanttActivityBarProps {
	activity: GanttActivityRow;
	rowIndex: number;
	totalWidth: number;
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
}

export const GanttActivityBar = memo(function GanttActivityBar({
	activity,
	rowIndex,
	totalWidth,
	isRtl,
	onDragStart,
	onAnchorDragStart,
	isDependencyDragging,
	onAnchorHover,
}: GanttActivityBarProps) {
	const { state } = useGantt();
	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;
	const [showTooltip, setShowTooltip] = useState(false);

	const isCritical = state.criticalActivityIds.has(activity.id);
	const isSelected = state.selectedActivityId === activity.id;
	const isHovered = state.hoveredActivityId === activity.id;
	const isDragged = state.dragState?.activityId === activity.id;

	// Compute bar position, accounting for drag delta
	const pos = useMemo(() => {
		let act = activity;
		if (isDragged && state.dragState) {
			const delta = state.dragState.currentDeltaDays;
			if (delta !== 0 && activity.plannedStart && activity.plannedEnd) {
				const dragType = state.dragState.type;
				let newStart = activity.plannedStart;
				let newEnd = activity.plannedEnd;

				if (dragType === "move") {
					newStart = addDays(activity.plannedStart, delta);
					newEnd = addDays(activity.plannedEnd, delta);
				} else if (dragType === "resize-start") {
					newStart = addDays(activity.plannedStart, delta);
				} else if (dragType === "resize-end") {
					newEnd = addDays(activity.plannedEnd, delta);
				}

				act = { ...activity, plannedStart: newStart, plannedEnd: newEnd };
			}
		}

		return computeActivityBarPosition(
			act,
			state.dateRange.start,
			pixelsPerDay,
			isRtl,
			totalWidth,
			rowIndex,
		);
	}, [activity, state.dateRange.start, pixelsPerDay, isRtl, totalWidth, rowIndex, isDragged, state.dragState]);

	const handleMouseDown = useCallback(
		(type: DragType) => (e: React.MouseEvent) => {
			onDragStart(activity.id, type, e, activity);
		},
		[activity, onDragStart],
	);

	if (!pos) return null;

	const fillColor = isCritical
		? CRITICAL_PATH_BG
		: STATUS_BG_COLORS[activity.status] ?? "#e2e8f0";
	const strokeColor = isCritical
		? CRITICAL_PATH_COLOR
		: STATUS_COLORS[activity.status] ?? "#94a3b8";
	const progressWidth = (pos.width * activity.progress) / 100;

	return (
		<g
			onMouseEnter={() => setShowTooltip(true)}
			onMouseLeave={() => setShowTooltip(false)}
		>
			{/* Selection highlight */}
			{isSelected && (
				<rect
					x={pos.x - 2}
					y={pos.y - 2}
					width={pos.width + 4}
					height={GANTT_BAR_HEIGHT + 4}
					rx={6}
					fill="none"
					stroke={strokeColor}
					strokeWidth={2}
					strokeDasharray="4 2"
					opacity={0.5}
				/>
			)}

			{/* Background bar */}
			<rect
				x={pos.x}
				y={pos.y}
				width={pos.width}
				height={GANTT_BAR_HEIGHT}
				rx={4}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth={isHovered || isDragged ? 1.5 : 1}
				opacity={isDragged ? 0.8 : 1}
			/>

			{/* Progress fill */}
			{progressWidth > 0 && (
				<rect
					x={isRtl ? pos.x + pos.width - progressWidth : pos.x}
					y={pos.y}
					width={Math.min(progressWidth, pos.width)}
					height={GANTT_BAR_HEIGHT}
					rx={4}
					fill={strokeColor}
					opacity={0.3}
				/>
			)}

			{/* Progress text (only if bar is wide enough) */}
			{pos.width > 40 && (
				<text
					x={pos.x + pos.width / 2}
					y={pos.y + GANTT_BAR_HEIGHT / 2 + 4}
					textAnchor="middle"
					className="text-[10px] fill-foreground font-medium"
					style={{ pointerEvents: "none" }}
				>
					{activity.progress}%
				</text>
			)}

			{/* Drag handle: move (center area) */}
			<rect
				x={pos.x + GANTT_DRAG_HANDLE_WIDTH}
				y={pos.y}
				width={Math.max(pos.width - GANTT_DRAG_HANDLE_WIDTH * 2, 0)}
				height={GANTT_BAR_HEIGHT}
				fill="transparent"
				cursor="grab"
				onMouseDown={handleMouseDown("move")}
			/>

			{/* Drag handle: resize-start (left edge) */}
			{pos.width > GANTT_MIN_BAR_WIDTH && (
				<rect
					x={pos.x}
					y={pos.y}
					width={GANTT_DRAG_HANDLE_WIDTH}
					height={GANTT_BAR_HEIGHT}
					fill="transparent"
					cursor="ew-resize"
					onMouseDown={handleMouseDown("resize-start")}
				/>
			)}

			{/* Drag handle: resize-end (right edge) */}
			{pos.width > GANTT_MIN_BAR_WIDTH && (
				<rect
					x={pos.x + pos.width - GANTT_DRAG_HANDLE_WIDTH}
					y={pos.y}
					width={GANTT_DRAG_HANDLE_WIDTH}
					height={GANTT_BAR_HEIGHT}
					fill="transparent"
					cursor="ew-resize"
					onMouseDown={handleMouseDown("resize-end")}
				/>
			)}

			{/* Dependency anchor points (visible when dependency-dragging or hovered) */}
			{(isDependencyDragging || isHovered) && onAnchorDragStart && (
				<>
					{/* Start anchor */}
					<circle
						cx={pos.x}
						cy={pos.y + GANTT_BAR_HEIGHT / 2}
						r={5}
						fill={strokeColor}
						stroke="white"
						strokeWidth={1.5}
						cursor="crosshair"
						onMouseDown={(e) => onAnchorDragStart(activity.id, "start", e)}
						onMouseEnter={() => onAnchorHover?.(activity.id, "start")}
						onMouseLeave={() => onAnchorHover?.(null, null)}
					/>
					{/* End anchor */}
					<circle
						cx={pos.x + pos.width}
						cy={pos.y + GANTT_BAR_HEIGHT / 2}
						r={5}
						fill={strokeColor}
						stroke="white"
						strokeWidth={1.5}
						cursor="crosshair"
						onMouseDown={(e) => onAnchorDragStart(activity.id, "end", e)}
						onMouseEnter={() => onAnchorHover?.(activity.id, "end")}
						onMouseLeave={() => onAnchorHover?.(null, null)}
					/>
				</>
			)}

			{/* Tooltip */}
			<GanttBarTooltip
				activity={activity}
				x={pos.x}
				y={pos.y}
				visible={showTooltip && !isDragged}
			/>
		</g>
	);
});
