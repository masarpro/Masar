"use client";

import { TODAY_LINE_COLOR, HEADER_HEIGHT } from "./constants";

interface GanttTodayMarkerProps {
	x: number;
	totalHeight: number;
}

export function GanttTodayMarker({ x, totalHeight }: GanttTodayMarkerProps) {
	if (x < 0) return null;

	return (
		<g>
			{/* Today line */}
			<line
				x1={x}
				y1={0}
				x2={x}
				y2={totalHeight}
				stroke={TODAY_LINE_COLOR}
				strokeWidth={2}
				strokeDasharray="4 2"
				opacity={0.8}
			/>
			{/* Today marker diamond */}
			<polygon
				points={`${x},${HEADER_HEIGHT - 8} ${x + 6},${HEADER_HEIGHT} ${x},${HEADER_HEIGHT + 8} ${x - 6},${HEADER_HEIGHT}`}
				fill={TODAY_LINE_COLOR}
				opacity={0.9}
			/>
		</g>
	);
}
