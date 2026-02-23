"use client";

import { useTranslations } from "next-intl";
import { AlertTriangleIcon } from "lucide-react";
import type { GanttMilestone } from "./types";
import { ROW_HEIGHT, HEADER_HEIGHT, SIDEBAR_WIDTH } from "./constants";
import {
	MilestoneStatusBadge,
} from "../TimelineHealthBadge";

interface GanttSidebarProps {
	milestones: GanttMilestone[];
	scrollTop: number;
	onMilestoneClick: (milestone: GanttMilestone) => void;
}

export function GanttSidebar({ milestones, scrollTop, onMilestoneClick }: GanttSidebarProps) {
	const t = useTranslations();

	return (
		<div
			className="flex-shrink-0 border-e border-border/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70"
			style={{ width: SIDEBAR_WIDTH }}
		>
			{/* Header */}
			<div
				className="flex items-center px-3 border-b border-border/50 font-semibold text-sm text-muted-foreground"
				style={{ height: HEADER_HEIGHT }}
			>
				{t("timeline.gantt.milestones")}
			</div>

			{/* Scrollable milestone list */}
			<div className="overflow-hidden" style={{ marginTop: -scrollTop }}>
				{milestones.map((m) => (
					<div
						key={m.id}
						className="flex items-center gap-2 px-3 border-b border-border/20 hover:bg-muted/30 cursor-pointer transition-colors"
						style={{ height: ROW_HEIGHT }}
						onClick={() => onMilestoneClick(m)}
					>
						{m.isCritical && (
							<AlertTriangleIcon className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
						)}
						<span className="text-sm font-medium truncate flex-1">{m.title}</span>
						<MilestoneStatusBadge status={m.status} size="sm" />
					</div>
				))}
			</div>
		</div>
	);
}
