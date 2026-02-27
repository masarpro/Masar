"use client";

import { useCallback, useRef, useEffect, type ReactNode } from "react";
import { useGantt } from "../../hooks/use-gantt-context";
import {
	MIN_SPLIT_RATIO,
	MAX_SPLIT_RATIO,
	SPLIT_DIVIDER_WIDTH,
} from "../../lib/gantt-constants";

interface GanttSplitPaneProps {
	tableContent: ReactNode;
	chartContent: ReactNode;
}

export function GanttSplitPane({
	tableContent,
	chartContent,
}: GanttSplitPaneProps) {
	const { state, dispatch } = useGantt();
	const containerRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);

	const handleDividerMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			isDraggingRef.current = true;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";

			const handleMouseMove = (me: MouseEvent) => {
				if (!isDraggingRef.current || !containerRef.current) return;
				const rect = containerRef.current.getBoundingClientRect();
				const x = me.clientX - rect.left;
				// In RTL, the table is on the right side
				const isRtl =
					document.documentElement.dir === "rtl" ||
					document.documentElement.getAttribute("dir") === "rtl";
				let ratio: number;
				if (isRtl) {
					ratio = 1 - x / rect.width;
				} else {
					ratio = x / rect.width;
				}
				ratio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, ratio));
				dispatch({ type: "SET_SPLIT_RATIO", ratio });
			};

			const handleMouseUp = () => {
				isDraggingRef.current = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				window.removeEventListener("mousemove", handleMouseMove);
				window.removeEventListener("mouseup", handleMouseUp);
			};

			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		},
		[dispatch],
	);

	const tableWidth = `${state.splitPaneRatio * 100}%`;
	const dividerWidth = `${SPLIT_DIVIDER_WIDTH}px`;

	return (
		<div
			ref={containerRef}
			className="flex h-full w-full overflow-hidden"
			style={{
				display: "grid",
				gridTemplateColumns: `${tableWidth} ${dividerWidth} 1fr`,
			}}
		>
			{/* WBS Table (right side in RTL due to grid auto-reverse) */}
			<div className="overflow-hidden">{tableContent}</div>

			{/* Divider */}
			<div
				className="cursor-col-resize bg-border hover:bg-primary/30 transition-colors"
				onMouseDown={handleDividerMouseDown}
				role="separator"
				aria-orientation="vertical"
			/>

			{/* Chart (left side in RTL) */}
			<div className="overflow-hidden">{chartContent}</div>
		</div>
	);
}
