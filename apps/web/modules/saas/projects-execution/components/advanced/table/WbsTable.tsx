"use client";

import { useCallback, type RefObject } from "react";
import { GANTT_ROW_HEIGHT } from "../../../lib/gantt-constants";
import { useGantt } from "../../../hooks/use-gantt-context";
import { WbsTableHeader } from "./WbsTableHeader";
import { WbsMilestoneRow } from "./WbsMilestoneRow";
import { WbsActivityRow } from "./WbsActivityRow";
import type { FlatGanttRow } from "../../../lib/gantt-types";

interface WbsTableProps {
	scrollRef: RefObject<HTMLDivElement | null>;
	onScroll: () => void;
	visibleRows: FlatGanttRow[];
	topPadding: number;
	totalHeight: number;
}

export function WbsTable({
	scrollRef,
	onScroll,
	visibleRows,
	topPadding,
	totalHeight,
}: WbsTableProps) {
	const { dispatch } = useGantt();

	return (
		<div className="flex h-full flex-col">
			<WbsTableHeader />
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto overflow-x-auto"
				onScroll={onScroll}
			>
				<div style={{ height: totalHeight, position: "relative" }}>
					<div
						style={{
							position: "absolute",
							top: topPadding,
							left: 0,
							right: 0,
						}}
					>
						{visibleRows.map((flatRow) => {
							if (flatRow.row.type === "milestone") {
								return (
									<WbsMilestoneRow
										key={flatRow.row.id}
										milestone={flatRow.row}
									/>
								);
							}
							return (
								<WbsActivityRow
									key={flatRow.row.id}
									activity={flatRow.row}
								/>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
