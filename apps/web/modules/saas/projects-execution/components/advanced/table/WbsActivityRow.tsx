"use client";

import { memo } from "react";
import { useLocale } from "next-intl";
import type { GanttActivityRow } from "../../../lib/gantt-types";
import { GANTT_ROW_HEIGHT, STATUS_COLORS, CRITICAL_PATH_COLOR } from "../../../lib/gantt-constants";
import { formatDateShort, getDurationDays } from "../../../lib/gantt-utils";
import { useGantt } from "../../../hooks/use-gantt-context";

interface WbsActivityRowProps {
	activity: GanttActivityRow;
}

export const WbsActivityRow = memo(function WbsActivityRow({
	activity,
}: WbsActivityRowProps) {
	const { state, dispatch } = useGantt();
	const locale = useLocale();
	const isSelected = state.selectedActivityId === activity.id;
	const isHovered = state.hoveredActivityId === activity.id;
	const isCritical = state.criticalActivityIds.has(activity.id);
	const duration = getDurationDays(activity.plannedStart, activity.plannedEnd);

	// Row coloring based on status
	const getRowBgClass = () => {
		if (isSelected) return "bg-primary/10 border-s-2 border-s-primary";
		if (isHovered) return "bg-muted/30";
		if (isCritical && activity.status !== "COMPLETED")
			return "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30";
		if (activity.status === "COMPLETED")
			return "bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50/70 dark:hover:bg-green-950/30";
		if (activity.status === "DELAYED")
			return "bg-yellow-50/50 dark:bg-yellow-950/20 hover:bg-yellow-50/70 dark:hover:bg-yellow-950/30";
		return "hover:bg-muted/20";
	};

	return (
		<div
			className={[
				"flex items-center border-b text-sm cursor-pointer transition-colors",
				getRowBgClass(),
			].join(" ")}
			style={{ height: GANTT_ROW_HEIGHT }}
			onClick={() =>
				dispatch({ type: "SELECT_ACTIVITY", activityId: activity.id })
			}
			onMouseEnter={() =>
				dispatch({ type: "HOVER_ACTIVITY", activityId: activity.id })
			}
			onMouseLeave={() =>
				dispatch({ type: "HOVER_ACTIVITY", activityId: null })
			}
		>
			{/* WBS */}
			<div className="w-[70px] shrink-0 px-2 text-center text-xs text-muted-foreground">
				{activity.wbsCode ?? "-"}
			</div>

			{/* Name */}
			<div className="min-w-[200px] flex-1 px-2 ps-6 flex items-center gap-2 truncate">
				<div
					className="h-2 w-2 rounded-full shrink-0"
					style={{
						backgroundColor: isCritical
							? CRITICAL_PATH_COLOR
							: STATUS_COLORS[activity.status] ?? "#94a3b8",
					}}
				/>
				<span className="truncate">{activity.title}</span>
			</div>

			{/* Duration */}
			<div className="w-[70px] shrink-0 px-2 text-center text-xs text-muted-foreground">
				{duration !== null ? `${duration}d` : activity.duration ? `${activity.duration}d` : "-"}
			</div>

			{/* Start */}
			<div className="w-[90px] shrink-0 px-2 text-xs text-muted-foreground">
				{formatDateShort(activity.plannedStart, locale)}
			</div>

			{/* End */}
			<div className="w-[90px] shrink-0 px-2 text-xs text-muted-foreground">
				{formatDateShort(activity.plannedEnd, locale)}
			</div>

			{/* Progress */}
			<div className="w-[60px] shrink-0 px-2 text-center text-xs">
				{activity.progress}%
			</div>
		</div>
	);
});
