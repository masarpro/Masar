"use client";

import { useRef, useCallback, useState, useEffect, type RefObject } from "react";
import { useGantt } from "../../../hooks/use-gantt-context";
import { GANTT_HEADER_HEIGHT } from "../../../lib/gantt-constants";
import { GanttSvgCanvas } from "./GanttSvgCanvas";
import type { FlatGanttRow, DragType, GanttActivityRow } from "../../../lib/gantt-types";

interface GanttChartAreaProps {
	scrollRef: RefObject<HTMLDivElement | null>;
	onScroll: () => void;
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

export function GanttChartArea({
	scrollRef,
	onScroll,
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
}: GanttChartAreaProps) {
	const { dispatch } = useGantt();

	const handleScroll = useCallback(() => {
		if (scrollRef.current) {
			dispatch({ type: "SET_SCROLL_TOP", scrollTop: scrollRef.current.scrollTop });
			dispatch({ type: "SET_SCROLL_LEFT", scrollLeft: scrollRef.current.scrollLeft });
		}
		onScroll();
	}, [dispatch, onScroll, scrollRef]);

	return (
		<div
			ref={scrollRef}
			className="h-full overflow-auto"
			onScroll={handleScroll}
		>
			<GanttSvgCanvas
				visibleRows={visibleRows}
				startIndex={startIndex}
				topPadding={topPadding}
				totalHeight={totalHeight}
				isRtl={isRtl}
				onDragStart={onDragStart}
				onAnchorDragStart={onAnchorDragStart}
				isDependencyDragging={isDependencyDragging}
				onAnchorHover={onAnchorHover}
				onDeleteDependency={onDeleteDependency}
			/>
		</div>
	);
}
