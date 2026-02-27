"use client";

import { memo, useMemo } from "react";
import { useGantt } from "../../../hooks/use-gantt-context";
import {
	GANTT_ROW_HEIGHT,
	GANTT_BAR_Y_OFFSET,
	GANTT_BAR_HEIGHT,
	BASELINE_GHOST_COLOR,
	ZOOM_CONFIGS,
} from "../../../lib/gantt-constants";
import { dateToPx } from "../../../lib/gantt-utils";
import type { FlatGanttRow } from "../../../lib/gantt-types";

interface GanttBaselineOverlayProps {
	visibleRows: FlatGanttRow[];
	startIndex: number;
	totalWidth: number;
	isRtl: boolean;
	topPadding: number;
}

export const GanttBaselineOverlay = memo(function GanttBaselineOverlay({
	visibleRows,
	startIndex,
	totalWidth,
	isRtl,
	topPadding,
}: GanttBaselineOverlayProps) {
	const { state } = useGantt();

	if (!state.showBaseline || !state.baselineData) return null;

	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;
	const baselineMap = new Map(
		state.baselineData.activities.map((a) => [a.activityId, a]),
	);

	return (
		<g transform={`translate(0, ${topPadding})`}>
			{visibleRows.map((flatRow, idx) => {
				if (flatRow.row.type !== "activity") return null;
				const baselineEntry = baselineMap.get(flatRow.row.id);
				if (!baselineEntry?.plannedStart || !baselineEntry?.plannedEnd)
					return null;

				const x1 = dateToPx(
					baselineEntry.plannedStart,
					state.dateRange.start,
					pixelsPerDay,
					isRtl,
					totalWidth,
				);
				const x2 = dateToPx(
					baselineEntry.plannedEnd,
					state.dateRange.start,
					pixelsPerDay,
					isRtl,
					totalWidth,
				);
				const x = Math.min(x1, x2);
				const width = Math.max(Math.abs(x2 - x1), 4);
				const y =
					idx * GANTT_ROW_HEIGHT + GANTT_BAR_Y_OFFSET + GANTT_BAR_HEIGHT + 2;

				return (
					<rect
						key={flatRow.row.id}
						x={x}
						y={y}
						width={width}
						height={4}
						rx={2}
						fill={BASELINE_GHOST_COLOR}
					/>
				);
			})}
		</g>
	);
});
