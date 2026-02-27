"use client";

import { memo } from "react";
import { useGantt } from "../../../hooks/use-gantt-context";
import { DependencyArrow } from "./DependencyArrow";
import type { FlatGanttRow } from "../../../lib/gantt-types";

interface DependencyLayerProps {
	flatRows: FlatGanttRow[];
	totalWidth: number;
	isRtl: boolean;
	onDelete?: (id: string) => void;
}

export const DependencyLayer = memo(function DependencyLayer({
	flatRows,
	totalWidth,
	isRtl,
	onDelete,
}: DependencyLayerProps) {
	const { state } = useGantt();

	// Build a set of visible activity IDs for filtering
	const visibleActivityIds = new Set(
		flatRows
			.filter((r) => r.row.type === "activity")
			.map((r) => r.row.id),
	);

	// Only render arrows where at least one endpoint is visible
	const visibleDeps = state.dependencies.filter(
		(d) =>
			visibleActivityIds.has(d.predecessorId) ||
			visibleActivityIds.has(d.successorId),
	);

	return (
		<g>
			{visibleDeps.map((dep) => (
				<DependencyArrow
					key={dep.id}
					dependency={dep}
					flatRows={flatRows}
					totalWidth={totalWidth}
					isRtl={isRtl}
					onDelete={onDelete}
				/>
			))}
		</g>
	);
});
