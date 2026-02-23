"use client";

import { useTranslations } from "next-intl";
import type { GanttMilestone } from "./types";
import { formatDateFull } from "./utils";

interface GanttTooltipProps {
	milestone: GanttMilestone;
	x: number;
	y: number;
	visible: boolean;
	locale: string;
}

export function GanttTooltip({ milestone, x, y, visible, locale }: GanttTooltipProps) {
	const t = useTranslations();

	if (!visible) return null;

	const statusKey = milestone.status.toLowerCase().replace("_", "") === "inprogress"
		? "inProgress"
		: milestone.status.toLowerCase();
	const healthKey = milestone.healthStatus === "ON_TRACK"
		? "onTrack"
		: milestone.healthStatus === "AT_RISK"
			? "atRisk"
			: "delayed";

	return (
		<div
			className="fixed z-50 pointer-events-none"
			style={{ left: x, top: y - 8, transform: "translate(-50%, -100%)" }}
		>
			<div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/30 dark:border-slate-700/40 rounded-lg shadow-lg px-3 py-2 min-w-[200px]">
				<div className="flex items-center gap-2 mb-1">
					<span className="font-semibold text-sm truncate max-w-[180px]">
						{milestone.title}
					</span>
					{milestone.isCritical && (
						<span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
					)}
				</div>

				<div className="space-y-0.5 text-xs text-muted-foreground">
					<div className="flex justify-between gap-4">
						<span>{t("timeline.gantt.status")}:</span>
						<span className="font-medium">{t(`timeline.status.${statusKey}`)}</span>
					</div>
					<div className="flex justify-between gap-4">
						<span>{t("timeline.gantt.health")}:</span>
						<span className="font-medium">{t(`timeline.health.${healthKey}`)}</span>
					</div>
					<div className="flex justify-between gap-4">
						<span>{t("timeline.gantt.planned")}:</span>
						<span dir="ltr">
							{formatDateFull(milestone.plannedStart, locale)} → {formatDateFull(milestone.plannedEnd, locale)}
						</span>
					</div>
					{milestone.actualStart && (
						<div className="flex justify-between gap-4">
							<span>{t("timeline.gantt.actual")}:</span>
							<span dir="ltr">
								{formatDateFull(milestone.actualStart, locale)} → {formatDateFull(milestone.actualEnd, locale)}
							</span>
						</div>
					)}
					<div className="flex justify-between gap-4">
						<span>{t("timeline.progress")}:</span>
						<span className="font-medium">{Math.round(milestone.progress)}%</span>
					</div>
				</div>
			</div>
		</div>
	);
}
