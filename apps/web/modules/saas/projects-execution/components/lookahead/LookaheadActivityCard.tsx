"use client";

import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { useLocale, useTranslations } from "next-intl";
import { formatDateShort } from "../../lib/gantt-utils";
import { STATUS_COLORS, CRITICAL_PATH_COLOR } from "../../lib/gantt-constants";

interface LookaheadActivity {
	id: string;
	title: string;
	wbsCode?: string | null;
	plannedStart: string | Date | null;
	plannedEnd: string | Date | null;
	status: string;
	progress: number;
	isCritical: boolean;
	milestoneName?: string;
	assignee?: { name: string } | null;
	predecessorCount?: number;
}

interface LookaheadActivityCardProps {
	activity: LookaheadActivity;
}

export function LookaheadActivityCard({ activity }: LookaheadActivityCardProps) {
	const t = useTranslations();
	const locale = useLocale();

	const isDelayed = activity.status === "DELAYED";
	const statusColor = STATUS_COLORS[activity.status] ?? "#94a3b8";

	return (
		<div
			className={`rounded-lg border p-3 space-y-2 ${
				isDelayed ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : ""
			} ${activity.isCritical ? "border-s-2 border-s-red-500" : ""}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<p className="font-medium text-sm truncate">{activity.title}</p>
					{activity.wbsCode && (
						<p className="text-xs text-muted-foreground">{activity.wbsCode}</p>
					)}
				</div>
				<div className="flex items-center gap-1 shrink-0">
					{activity.isCritical && (
						<Badge
							variant="destructive"
							className="text-[10px]"
						>
							{t("execution.lookahead.activity.critical")}
						</Badge>
					)}
					<Badge
						style={{ backgroundColor: statusColor, color: "white" }}
						className="text-[10px]"
					>
						{t(`execution.activity.status.${activity.status}`)}
					</Badge>
				</div>
			</div>

			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span>
					{formatDateShort(activity.plannedStart, locale)} →{" "}
					{formatDateShort(activity.plannedEnd, locale)}
				</span>
				{activity.assignee && <span>{activity.assignee.name}</span>}
			</div>

			<Progress value={activity.progress} className="h-1.5" />
		</div>
	);
}
