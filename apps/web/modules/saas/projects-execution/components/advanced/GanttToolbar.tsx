"use client";

import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	ArrowLeftIcon,
	BarChart3Icon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClipboardListIcon,
	CrosshairIcon,
	LayersIcon,
	SettingsIcon,
	ZapIcon,
	ZoomInIcon,
	ZoomOutIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useGantt } from "../../hooks/use-gantt-context";
import type { GanttZoomLevel } from "../../lib/gantt-types";

const ZOOM_ORDER: GanttZoomLevel[] = ["day", "week", "month", "quarter"];

interface GanttToolbarProps {
	onOpenCalendarSettings: () => void;
	onOpenBaselineManagement: () => void;
	onScrollToToday?: () => void;
}

export function GanttToolbar({
	onOpenCalendarSettings,
	onOpenBaselineManagement,
	onScrollToToday,
}: GanttToolbarProps) {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const projectId = params.projectId as string;
	const { state, dispatch } = useGantt();
	const [showCriticalPath, setShowCriticalPath] = useState(true);

	const currentZoomIdx = ZOOM_ORDER.indexOf(state.zoom);

	const handleZoomIn = () => {
		if (currentZoomIdx > 0) {
			dispatch({ type: "SET_ZOOM", zoom: ZOOM_ORDER[currentZoomIdx - 1] });
		}
	};

	const handleZoomOut = () => {
		if (currentZoomIdx < ZOOM_ORDER.length - 1) {
			dispatch({ type: "SET_ZOOM", zoom: ZOOM_ORDER[currentZoomIdx + 1] });
		}
	};

	const basePath = `/app/${organizationSlug}/projects/${projectId}/execution`;

	return (
		<div className="flex items-center gap-2 border-b px-3 py-2 flex-wrap">
			{/* Back to simple mode */}
			<Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
				<Link href={basePath}>
					<ArrowLeftIcon className="h-3.5 w-3.5" />
					{t("execution.advanced.toolbar.simpleMode")}
				</Link>
			</Button>

			<div className="h-5 w-px bg-border" />

			{/* Zoom controls */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleZoomIn}
					disabled={currentZoomIdx === 0}
					title={t("execution.advanced.toolbar.zoomIn")}
				>
					<ZoomInIcon className="h-4 w-4" />
				</Button>

				<Select
					value={state.zoom}
					onValueChange={(v: string) =>
						dispatch({ type: "SET_ZOOM", zoom: v as GanttZoomLevel })
					}
				>
					<SelectTrigger className="h-8 w-[100px] text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{ZOOM_ORDER.map((z) => (
							<SelectItem key={z} value={z}>
								{t(`execution.advanced.toolbar.${z}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleZoomOut}
					disabled={currentZoomIdx === ZOOM_ORDER.length - 1}
					title={t("execution.advanced.toolbar.zoomOut")}
				>
					<ZoomOutIcon className="h-4 w-4" />
				</Button>
			</div>

			<div className="h-5 w-px bg-border" />

			{/* Today */}
			<Button
				variant="ghost"
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={onScrollToToday}
			>
				<CrosshairIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.today")}
			</Button>

			{/* Expand/Collapse */}
			<Button
				variant="ghost"
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={() => dispatch({ type: "EXPAND_ALL" })}
			>
				<ChevronDownIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.expandAll")}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={() => dispatch({ type: "COLLAPSE_ALL" })}
			>
				<ChevronUpIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.collapseAll")}
			</Button>

			<div className="h-5 w-px bg-border" />

			{/* Critical path toggle */}
			<Button
				variant={showCriticalPath ? "secondary" : "ghost"}
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={() => setShowCriticalPath(!showCriticalPath)}
			>
				<ZapIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.criticalPath")}
			</Button>

			{/* Baseline toggle */}
			<Button
				variant={state.showBaseline ? "secondary" : "ghost"}
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={() =>
					dispatch({ type: "SET_SHOW_BASELINE", show: !state.showBaseline })
				}
			>
				<LayersIcon className="h-3.5 w-3.5" />
				{state.showBaseline
					? t("execution.advanced.toolbar.hideBaseline")
					: t("execution.advanced.toolbar.showBaseline")}
			</Button>

			<div className="flex-1" />

			{/* Lookahead link */}
			<Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
				<Link href={`${basePath}/lookahead`}>
					<ClipboardListIcon className="h-3.5 w-3.5" />
					{t("execution.advanced.toolbar.lookahead")}
				</Link>
			</Button>

			{/* Analysis link */}
			<Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
				<Link href={`${basePath}/analysis`}>
					<BarChart3Icon className="h-3.5 w-3.5" />
					{t("execution.advanced.toolbar.analysis")}
				</Link>
			</Button>

			<div className="h-5 w-px bg-border" />

			{/* Calendar settings */}
			<Button
				variant="ghost"
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={onOpenCalendarSettings}
			>
				<CalendarIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.calendarSettings")}
			</Button>

			{/* Baseline management */}
			<Button
				variant="ghost"
				size="sm"
				className="h-8 text-xs gap-1"
				onClick={onOpenBaselineManagement}
			>
				<SettingsIcon className="h-3.5 w-3.5" />
				{t("execution.advanced.toolbar.baselineManagement")}
			</Button>
		</div>
	);
}
