"use client";

import { useCallback, type MouseEvent } from "react";
import type { GanttMilestone, BarPosition } from "./types";
import { STATUS_COLORS, ROW_HEIGHT, BAR_HEIGHT, ACTUAL_BAR_HEIGHT, GRID_LINE_COLOR } from "./constants";
import { computeBarPosition, computeActualBarPosition } from "./utils";

interface GanttRowProps {
	milestone: GanttMilestone;
	rowIndex: number;
	rangeStart: Date;
	columnWidth: number;
	isRtl: boolean;
	totalWidth: number;
	onMouseEnter: (milestone: GanttMilestone, e: MouseEvent) => void;
	onMouseLeave: () => void;
	onClick: (milestone: GanttMilestone) => void;
	onDragStart: (milestoneId: string, type: "move" | "resize-start" | "resize-end", e: MouseEvent) => void;
}

export function GanttRow({
	milestone,
	rowIndex,
	rangeStart,
	columnWidth,
	isRtl,
	totalWidth,
	onMouseEnter,
	onMouseLeave,
	onClick,
	onDragStart,
}: GanttRowProps) {
	const colors = STATUS_COLORS[milestone.status];
	const bar = computeBarPosition(milestone, rangeStart, columnWidth, isRtl, totalWidth, rowIndex);
	const actualBar = computeActualBarPosition(milestone, rangeStart, columnWidth, isRtl, totalWidth, rowIndex);

	const y = rowIndex * ROW_HEIGHT;

	const handleMouseEnter = useCallback(
		(e: MouseEvent) => onMouseEnter(milestone, e),
		[milestone, onMouseEnter],
	);

	const handleClick = useCallback(() => onClick(milestone), [milestone, onClick]);

	const handleDragMove = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation();
			onDragStart(milestone.id, "move", e);
		},
		[milestone.id, onDragStart],
	);

	const handleDragResizeStart = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation();
			onDragStart(milestone.id, isRtl ? "resize-end" : "resize-start", e);
		},
		[milestone.id, isRtl, onDragStart],
	);

	const handleDragResizeEnd = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation();
			onDragStart(milestone.id, isRtl ? "resize-start" : "resize-end", e);
		},
		[milestone.id, isRtl, onDragStart],
	);

	return (
		<g>
			{/* Row background & hover */}
			<rect
				x={0}
				y={y}
				width={totalWidth}
				height={ROW_HEIGHT}
				fill="transparent"
				className="hover:fill-muted/30 transition-colors"
			/>

			{/* Row separator line */}
			<line
				x1={0}
				y1={y + ROW_HEIGHT}
				x2={totalWidth}
				y2={y + ROW_HEIGHT}
				stroke={GRID_LINE_COLOR}
				strokeWidth={0.5}
			/>

			{bar && (
				<g
					onMouseEnter={handleMouseEnter}
					onMouseLeave={onMouseLeave}
					onClick={handleClick}
					className="cursor-pointer"
				>
					{/* Planned bar (background) */}
					<rect
						x={bar.x}
						y={bar.y}
						width={bar.width}
						height={BAR_HEIGHT}
						rx={4}
						ry={4}
						fill={colors.bg}
						stroke={colors.border}
						strokeWidth={1.5}
						strokeDasharray={milestone.status === "PLANNED" ? "4 2" : "none"}
					/>

					{/* Progress fill */}
					{milestone.progress > 0 && (
						<rect
							x={isRtl ? bar.x + bar.width - bar.width * (milestone.progress / 100) : bar.x}
							y={bar.y}
							width={bar.width * (milestone.progress / 100)}
							height={BAR_HEIGHT}
							rx={4}
							ry={4}
							fill={colors.border}
							opacity={0.5}
						/>
					)}

					{/* Critical marker dot */}
					{milestone.isCritical && (
						<circle
							cx={isRtl ? bar.x + bar.width + 8 : bar.x - 8}
							cy={bar.y + BAR_HEIGHT / 2}
							r={4}
							fill="rgb(245, 158, 11)"
							stroke="white"
							strokeWidth={1}
						/>
					)}

					{/* Bar label (title) - only visible at week zoom */}
					{bar.width > 60 && (
						<text
							x={bar.x + bar.width / 2}
							y={bar.y + BAR_HEIGHT / 2}
							textAnchor="middle"
							dominantBaseline="central"
							fontSize={10}
							fontWeight={500}
							fill={colors.text}
							className="pointer-events-none select-none"
							direction={isRtl ? "rtl" : "ltr"}
						>
							{milestone.title.length > Math.floor(bar.width / 7)
								? `${milestone.title.slice(0, Math.floor(bar.width / 7) - 2)}..`
								: milestone.title}
						</text>
					)}

					{/* Drag handle: start edge */}
					<rect
						x={bar.x}
						y={bar.y}
						width={6}
						height={BAR_HEIGHT}
						fill="transparent"
						className="cursor-col-resize"
						onMouseDown={handleDragResizeStart}
					/>

					{/* Drag handle: end edge */}
					<rect
						x={bar.x + bar.width - 6}
						y={bar.y}
						width={6}
						height={BAR_HEIGHT}
						fill="transparent"
						className="cursor-col-resize"
						onMouseDown={handleDragResizeEnd}
					/>

					{/* Drag handle: center (move) */}
					<rect
						x={bar.x + 6}
						y={bar.y}
						width={Math.max(bar.width - 12, 0)}
						height={BAR_HEIGHT}
						fill="transparent"
						className="cursor-grab active:cursor-grabbing"
						onMouseDown={handleDragMove}
					/>
				</g>
			)}

			{/* Actual bar (solid, thinner, below planned) */}
			{actualBar && (
				<rect
					x={actualBar.x}
					y={actualBar.y}
					width={actualBar.width}
					height={ACTUAL_BAR_HEIGHT}
					rx={2}
					ry={2}
					fill={milestone.status === "COMPLETED" ? "rgb(34, 197, 94)" : "rgb(20, 184, 166)"}
					opacity={0.8}
				/>
			)}
		</g>
	);
}
