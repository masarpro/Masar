"use client";

import { memo } from "react";
import { DEPENDENCY_ARROW_COLOR } from "../../../lib/gantt-constants";

interface DependencyDrawLineProps {
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
}

export const DependencyDrawLine = memo(function DependencyDrawLine({
	fromX,
	fromY,
	toX,
	toY,
}: DependencyDrawLineProps) {
	return (
		<line
			x1={fromX}
			y1={fromY}
			x2={toX}
			y2={toY}
			stroke={DEPENDENCY_ARROW_COLOR}
			strokeWidth={2}
			strokeDasharray="6 3"
			opacity={0.6}
			style={{ pointerEvents: "none" }}
		/>
	);
});
