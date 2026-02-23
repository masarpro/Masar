"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	CalendarDaysIcon,
	CrosshairIcon,
	FilterIcon,
	XIcon,
} from "lucide-react";
import type { ZoomLevel, GanttFilters, StatusFilter, HealthFilter } from "./types";

interface GanttToolbarProps {
	zoom: ZoomLevel;
	onZoomChange: (zoom: ZoomLevel) => void;
	filters: GanttFilters;
	onFiltersChange: (filters: GanttFilters) => void;
	hasActiveFilters: boolean;
	onResetFilters: () => void;
	onScrollToToday: () => void;
}

export function GanttToolbar({
	zoom,
	onZoomChange,
	filters,
	onFiltersChange,
	hasActiveFilters,
	onResetFilters,
	onScrollToToday,
}: GanttToolbarProps) {
	const t = useTranslations();

	return (
		<div className="flex items-center justify-between gap-3 flex-wrap">
			{/* Zoom controls */}
			<div className="flex items-center gap-1 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-lg p-1">
				{(["week", "month", "quarter"] as ZoomLevel[]).map((level) => (
					<Button
						key={level}
						size="sm"
						variant={zoom === level ? "primary" : "ghost"}
						onClick={() => onZoomChange(level)}
						className="h-7 px-3 text-xs"
					>
						{t(`timeline.gantt.zoom.${level}`)}
					</Button>
				))}
			</div>

			<div className="flex items-center gap-2">
				{/* Status filter */}
				<Select
					value={filters.status}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, status: value as StatusFilter })
					}
				>
					<SelectTrigger className="h-8 w-[140px] text-xs">
						<FilterIcon className="h-3 w-3 me-1" />
						<SelectValue placeholder={t("timeline.gantt.filterStatus")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">{t("timeline.gantt.allStatuses")}</SelectItem>
						<SelectItem value="PLANNED">{t("timeline.status.planned")}</SelectItem>
						<SelectItem value="IN_PROGRESS">{t("timeline.status.inProgress")}</SelectItem>
						<SelectItem value="COMPLETED">{t("timeline.status.completed")}</SelectItem>
						<SelectItem value="DELAYED">{t("timeline.status.delayed")}</SelectItem>
					</SelectContent>
				</Select>

				{/* Health filter */}
				<Select
					value={filters.health}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, health: value as HealthFilter })
					}
				>
					<SelectTrigger className="h-8 w-[140px] text-xs">
						<FilterIcon className="h-3 w-3 me-1" />
						<SelectValue placeholder={t("timeline.gantt.filterHealth")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">{t("timeline.gantt.allHealth")}</SelectItem>
						<SelectItem value="ON_TRACK">{t("timeline.health.onTrack")}</SelectItem>
						<SelectItem value="AT_RISK">{t("timeline.health.atRisk")}</SelectItem>
						<SelectItem value="DELAYED">{t("timeline.health.delayed")}</SelectItem>
					</SelectContent>
				</Select>

				{/* Clear filters */}
				{hasActiveFilters && (
					<Button
						size="sm"
						variant="ghost"
						onClick={onResetFilters}
						className="h-8 px-2"
					>
						<XIcon className="h-3 w-3" />
					</Button>
				)}

				{/* Today button */}
				<Button
					size="sm"
					variant="outline"
					onClick={onScrollToToday}
					className="h-8"
				>
					<CrosshairIcon className="h-3.5 w-3.5 me-1" />
					{t("timeline.gantt.today")}
				</Button>
			</div>
		</div>
	);
}
