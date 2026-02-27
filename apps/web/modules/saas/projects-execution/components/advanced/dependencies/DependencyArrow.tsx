"use client";

import { memo, useMemo, useState } from "react";
import type { GanttDependency, FlatGanttRow } from "../../../lib/gantt-types";
import {
	DEPENDENCY_ARROW_COLOR,
	CRITICAL_PATH_COLOR,
	ZOOM_CONFIGS,
} from "../../../lib/gantt-constants";
import { computeDependencyPath, getArrowMarkerId } from "../../../lib/gantt-arrow-routing";
import { useGantt } from "../../../hooks/use-gantt-context";

interface DependencyArrowProps {
	dependency: GanttDependency;
	flatRows: FlatGanttRow[];
	totalWidth: number;
	isRtl: boolean;
	onDelete?: (id: string) => void;
}

export const DependencyArrow = memo(function DependencyArrow({
	dependency,
	flatRows,
	totalWidth,
	isRtl,
	onDelete,
}: DependencyArrowProps) {
	const { state } = useGantt();
	const [isHovered, setIsHovered] = useState(false);
	const pixelsPerDay = ZOOM_CONFIGS[state.zoom].pixelsPerDay;

	const isCritical =
		state.criticalActivityIds.has(dependency.predecessorId) &&
		state.criticalActivityIds.has(dependency.successorId);

	const path = useMemo(() => {
		const predRow = flatRows.find(
			(r) => r.row.type === "activity" && r.row.id === dependency.predecessorId,
		);
		const succRow = flatRows.find(
			(r) => r.row.type === "activity" && r.row.id === dependency.successorId,
		);

		if (!predRow || !succRow) return null;
		if (predRow.row.type !== "activity" || succRow.row.type !== "activity") return null;

		return computeDependencyPath(
			predRow.row.plannedStart,
			predRow.row.plannedEnd,
			succRow.row.plannedStart,
			succRow.row.plannedEnd,
			predRow.index,
			succRow.index,
			dependency.type,
			state.dateRange.start,
			pixelsPerDay,
			isRtl,
			totalWidth,
		);
	}, [dependency, flatRows, state.dateRange.start, pixelsPerDay, isRtl, totalWidth]);

	if (!path) return null;

	const color = isCritical ? CRITICAL_PATH_COLOR : DEPENDENCY_ARROW_COLOR;

	return (
		<g
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Invisible wider hitbox for easier hover */}
			<path
				d={path}
				fill="none"
				stroke="transparent"
				strokeWidth={12}
				style={{ cursor: isHovered ? "pointer" : "default" }}
				onClick={() => isHovered && onDelete?.(dependency.id)}
			/>
			{/* Visible arrow */}
			<path
				d={path}
				fill="none"
				stroke={color}
				strokeWidth={isHovered ? 2.5 : 1.5}
				markerEnd={`url(#${getArrowMarkerId(isCritical)})`}
				opacity={isHovered ? 1 : 0.7}
				style={{ transition: "stroke-width 0.15s, opacity 0.15s" }}
			/>
		</g>
	);
});
