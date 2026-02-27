"use client";

import { useRef, useCallback } from "react";

/**
 * Synchronizes vertical scrollTop between two scrollable containers (table + chart).
 * Uses a scrollSource ref to prevent infinite feedback loops.
 */
export function useGanttScrollSync() {
	const tableRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const scrollSourceRef = useRef<"table" | "chart" | null>(null);
	const rafRef = useRef<number | null>(null);

	const handleTableScroll = useCallback(() => {
		if (scrollSourceRef.current === "chart") return;
		scrollSourceRef.current = "table";

		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			if (tableRef.current && chartRef.current) {
				chartRef.current.scrollTop = tableRef.current.scrollTop;
			}
			scrollSourceRef.current = null;
		});
	}, []);

	const handleChartScroll = useCallback(() => {
		if (scrollSourceRef.current === "table") return;
		scrollSourceRef.current = "chart";

		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			if (tableRef.current && chartRef.current) {
				tableRef.current.scrollTop = chartRef.current.scrollTop;
			}
			scrollSourceRef.current = null;
		});
	}, []);

	return {
		tableRef,
		chartRef,
		handleTableScroll,
		handleChartScroll,
	};
}
