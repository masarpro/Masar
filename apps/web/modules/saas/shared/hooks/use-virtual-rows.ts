"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface UseVirtualRowsOptions {
	/** Total number of items */
	count: number;
	/** Estimated height of each row in px. Default 48 */
	rowHeight?: number;
	/** Extra rows rendered outside viewport. Default 10 */
	overscan?: number;
	/** Min items to activate virtualization. Below this, renders all rows. Default 50 */
	threshold?: number;
}

/**
 * Hook for virtualizing table rows.
 *
 * Usage:
 * ```tsx
 * const { containerRef, virtualItems, paddingTop, paddingBottom, isVirtualized } = useVirtualRows({
 *   count: items.length,
 *   rowHeight: 52,
 *   threshold: 50,
 * });
 *
 * return (
 *   <div ref={containerRef} className="overflow-auto" style={{ maxHeight: 600 }}>
 *     <table>
 *       <thead className="sticky top-0 z-10 bg-background">...</thead>
 *       <tbody>
 *         {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}
 *         {(isVirtualized ? virtualItems : items.map((_, i) => ({ index: i }))).map((vi) => {
 *           const item = items[vi.index];
 *           return <tr key={vi.index}>...</tr>;
 *         })}
 *         {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}
 *       </tbody>
 *     </table>
 *   </div>
 * );
 * ```
 */
export function useVirtualRows({
	count,
	rowHeight = 48,
	overscan = 10,
	threshold = 50,
}: UseVirtualRowsOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isVirtualized = count > threshold;

	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => containerRef.current,
		estimateSize: () => rowHeight,
		overscan,
		enabled: isVirtualized,
	});

	const virtualItems = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();

	const paddingTop =
		isVirtualized && virtualItems.length > 0 ? virtualItems[0].start : 0;
	const paddingBottom =
		isVirtualized && virtualItems.length > 0
			? totalSize - virtualItems[virtualItems.length - 1].end
			: 0;

	return {
		containerRef,
		virtualItems,
		paddingTop,
		paddingBottom,
		totalSize,
		isVirtualized,
		measureElement: virtualizer.measureElement,
	};
}
