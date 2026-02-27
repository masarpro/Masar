"use client";

import { memo } from "react";
import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useLocale } from "next-intl";
import type { GanttMilestoneRow } from "../../../lib/gantt-types";
import { GANTT_ROW_HEIGHT, STATUS_COLORS } from "../../../lib/gantt-constants";
import { formatDateShort, getDurationDays } from "../../../lib/gantt-utils";
import { useGantt } from "../../../hooks/use-gantt-context";

interface WbsMilestoneRowProps {
	milestone: GanttMilestoneRow;
}

export const WbsMilestoneRow = memo(function WbsMilestoneRow({
	milestone,
}: WbsMilestoneRowProps) {
	const { state, dispatch } = useGantt();
	const locale = useLocale();
	const isCollapsed = state.collapsedMilestones.has(milestone.id);
	const duration = getDurationDays(milestone.plannedStart, milestone.plannedEnd);

	return (
		<div
			className="flex items-center border-b bg-muted/20 font-medium text-sm cursor-pointer hover:bg-muted/40 transition-colors"
			style={{ height: GANTT_ROW_HEIGHT }}
			onClick={() =>
				dispatch({ type: "TOGGLE_COLLAPSE", milestoneId: milestone.id })
			}
		>
			{/* WBS */}
			<div className="w-[70px] shrink-0 px-2 text-center">
				<button className="p-0.5">
					{isCollapsed ? (
						<ChevronLeftIcon className="h-4 w-4" />
					) : (
						<ChevronDownIcon className="h-4 w-4" />
					)}
				</button>
			</div>

			{/* Name */}
			<div className="min-w-[200px] flex-1 px-2 flex items-center gap-2 truncate">
				<div
					className="h-2.5 w-2.5 rounded-full shrink-0"
					style={{
						backgroundColor: STATUS_COLORS[milestone.status] ?? "#94a3b8",
					}}
				/>
				<span className="truncate">{milestone.title}</span>
			</div>

			{/* Duration */}
			<div className="w-[70px] shrink-0 px-2 text-center text-xs text-muted-foreground">
				{duration !== null ? `${duration}d` : "-"}
			</div>

			{/* Start */}
			<div className="w-[90px] shrink-0 px-2 text-xs text-muted-foreground">
				{formatDateShort(milestone.plannedStart, locale)}
			</div>

			{/* End */}
			<div className="w-[90px] shrink-0 px-2 text-xs text-muted-foreground">
				{formatDateShort(milestone.plannedEnd, locale)}
			</div>

			{/* Progress */}
			<div className="w-[60px] shrink-0 px-2 text-center text-xs font-semibold">
				{milestone.progress}%
			</div>
		</div>
	);
});
