"use client";

import { useMemo } from "react";
import { GANTT_ROW_HEIGHT, OVERSCAN_ROWS } from "../lib/gantt-constants";
import type { FlatGanttRow } from "../lib/gantt-types";

interface VirtualizationResult {
	visibleRows: FlatGanttRow[];
	startIndex: number;
	endIndex: number;
	topPadding: number;
	totalHeight: number;
}

/**
 * Computes which rows should be rendered based on scroll position and container height.
 * Returns visible rows + padding for correct scrollbar sizing.
 */
export function useGanttVirtualization(
	flatRows: FlatGanttRow[],
	scrollTop: number,
	containerHeight: number,
): VirtualizationResult {
	return useMemo(() => {
		const totalHeight = flatRows.length * GANTT_ROW_HEIGHT;

		if (flatRows.length === 0) {
			return {
				visibleRows: [],
				startIndex: 0,
				endIndex: 0,
				topPadding: 0,
				totalHeight: 0,
			};
		}

		const startIndex = Math.max(
			0,
			Math.floor(scrollTop / GANTT_ROW_HEIGHT) - OVERSCAN_ROWS,
		);
		const endIndex = Math.min(
			flatRows.length - 1,
			Math.ceil((scrollTop + containerHeight) / GANTT_ROW_HEIGHT) +
				OVERSCAN_ROWS,
		);

		const visibleRows = flatRows.slice(startIndex, endIndex + 1);
		const topPadding = startIndex * GANTT_ROW_HEIGHT;

		return {
			visibleRows,
			startIndex,
			endIndex,
			topPadding,
			totalHeight,
		};
	}, [flatRows, scrollTop, containerHeight]);
}
