"use client";

import { memo, useMemo } from "react";
import type { GanttMilestoneRow } from "../../../lib/gantt-types";
import {
	GANTT_MILESTONE_BAR_HEIGHT,
	STATUS_COLORS,
	ZOOM_CONFIGS,
} from "../../../lib/gantt-constants";
import { computeMilestoneBarPosition } from "../../../lib/gantt-utils";
import { useGantt } from "../../../hooks/use-gantt-context";

interface GanttMilestoneGroupBarProps {
	milestone: GanttMilestoneRow;
	rowIndex: number;
	totalWidth: number;
	isRtl: boolean;
}

export const GanttMilestoneGroupBar = memo(function GanttMilestoneGroupBar({
	milestone,
	rowIndex,
	totalWidth,
	isRtl,
}: GanttMilestoneGroupBarProps) {
	const { state } = useGantt();
	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;

	const pos = useMemo(
		() =>
			computeMilestoneBarPosition(
				milestone,
				state.dateRange.start,
				pixelsPerDay,
				isRtl,
				totalWidth,
				rowIndex,
			),
		[milestone, state.dateRange.start, pixelsPerDay, isRtl, totalWidth, rowIndex],
	);

	if (!pos) return null;

	const color = STATUS_COLORS[milestone.status] ?? "#94a3b8";

	return (
		<g>
			{/* Summary bar (thin) */}
			<rect
				x={pos.x}
				y={pos.y}
				width={pos.width}
				height={GANTT_MILESTONE_BAR_HEIGHT}
				rx={2}
				fill={color}
				opacity={0.6}
			/>
			{/* Diamond endpoints */}
			<polygon
				points={`${pos.x},${pos.y + GANTT_MILESTONE_BAR_HEIGHT / 2} ${pos.x + 4},${pos.y} ${pos.x + 8},${pos.y + GANTT_MILESTONE_BAR_HEIGHT / 2} ${pos.x + 4},${pos.y + GANTT_MILESTONE_BAR_HEIGHT}`}
				fill={color}
			/>
			<polygon
				points={`${pos.x + pos.width - 8},${pos.y + GANTT_MILESTONE_BAR_HEIGHT / 2} ${pos.x + pos.width - 4},${pos.y} ${pos.x + pos.width},${pos.y + GANTT_MILESTONE_BAR_HEIGHT / 2} ${pos.x + pos.width - 4},${pos.y + GANTT_MILESTONE_BAR_HEIGHT}`}
				fill={color}
			/>
		</g>
	);
});
