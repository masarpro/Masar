"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { GanttActivityRow } from "../../../lib/gantt-types";
import { formatDateShort, getDurationDays } from "../../../lib/gantt-utils";
import { STATUS_COLORS } from "../../../lib/gantt-constants";

interface GanttBarTooltipProps {
	activity: GanttActivityRow;
	x: number;
	y: number;
	visible: boolean;
}

export const GanttBarTooltip = memo(function GanttBarTooltip({
	activity,
	x,
	y,
	visible,
}: GanttBarTooltipProps) {
	const t = useTranslations();
	const locale = useLocale();

	if (!visible) return null;

	const duration = getDurationDays(activity.plannedStart, activity.plannedEnd);
	const statusColor = STATUS_COLORS[activity.status] ?? "#94a3b8";

	return (
		<foreignObject x={x} y={y - 80} width={220} height={76} style={{ overflow: "visible" }}>
			<div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
				<div className="font-medium truncate mb-1">{activity.title}</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ backgroundColor: statusColor }}
					/>
					<span>{t(`execution.activity.status.${activity.status}`)}</span>
					<span className="ms-auto">{activity.progress}%</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground mt-1">
					<span>
						{formatDateShort(activity.plannedStart, locale)} →{" "}
						{formatDateShort(activity.plannedEnd, locale)}
					</span>
					{duration !== null && (
						<span className="ms-auto">{duration}d</span>
					)}
				</div>
			</div>
		</foreignObject>
	);
});
