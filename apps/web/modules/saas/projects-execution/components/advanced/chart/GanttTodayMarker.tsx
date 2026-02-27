"use client";

import { memo, useMemo } from "react";
import { useGantt } from "../../../hooks/use-gantt-context";
import { getTodayPosition } from "../../../lib/gantt-utils";
import { TODAY_LINE_COLOR, ZOOM_CONFIGS, GANTT_HEADER_HEIGHT } from "../../../lib/gantt-constants";

interface GanttTodayMarkerProps {
	totalWidth: number;
	totalHeight: number;
	isRtl: boolean;
}

export const GanttTodayMarker = memo(function GanttTodayMarker({
	totalWidth,
	totalHeight,
	isRtl,
}: GanttTodayMarkerProps) {
	const { state } = useGantt();
	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;

	const x = useMemo(
		() =>
			getTodayPosition(
				state.dateRange.start,
				pixelsPerDay,
				isRtl,
				totalWidth,
			),
		[state.dateRange.start, pixelsPerDay, isRtl, totalWidth],
	);

	if (x < 0 || x > totalWidth) return null;

	return (
		<g>
			<line
				x1={x}
				y1={GANTT_HEADER_HEIGHT}
				x2={x}
				y2={totalHeight}
				stroke={TODAY_LINE_COLOR}
				strokeWidth={2}
				strokeDasharray="4 4"
				opacity={0.7}
			/>
			{/* Today indicator triangle at top */}
			<polygon
				points={`${x - 5},${GANTT_HEADER_HEIGHT} ${x + 5},${GANTT_HEADER_HEIGHT} ${x},${GANTT_HEADER_HEIGHT + 6}`}
				fill={TODAY_LINE_COLOR}
			/>
		</g>
	);
});
