"use client";

import { formatRelativeTime } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { FileText, AlertTriangle, Camera, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const typeConfig: Record<string, { dot: string; label: string }> = {
	DAILY_REPORT: { dot: "bg-chart-4", label: "projects.field.dailyReport" },
	ISSUE: { dot: "bg-destructive", label: "projects.field.issue" },
	PHOTO: { dot: "bg-chart-3", label: "projects.field.photo" },
	PROGRESS_UPDATE: { dot: "bg-chart-1", label: "projects.field.progressUpdate" },
};

interface RecentActivitiesCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
}

export function RecentActivitiesCard({
	organizationId,
	projectId,
	basePath,
}: RecentActivitiesCardProps) {
	const t = useTranslations();

	const { data: fieldData } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: { organizationId, projectId, limit: 3 },
		}),
	);

	const timeline = fieldData?.timeline ?? [];

	return (
		<div className="rounded-2xl border-2 bg-card p-4 flex flex-col">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Clock className="h-4 w-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("projects.commandCenter.recentActivities")}
					</h3>
				</div>
				<Link
					href={`${basePath}/execution`}
					className="text-xs text-primary hover:underline font-medium"
				>
					{t("projects.commandCenter.viewAll")}
				</Link>
			</div>

			{timeline.length > 0 ? (
				<div className="flex-1 space-y-2">
					{timeline.map((item: any) => {
						const config = typeConfig[item.type] ?? typeConfig.PROGRESS_UPDATE;
						return (
							<div key={item.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
								<div className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
								<span className="text-xs text-muted-foreground truncate flex-1">
									{t(config.label)}
								</span>
								<span className="text-[10px] text-muted-foreground shrink-0">
									{formatRelativeTime(item.createdAt)}
								</span>
							</div>
						);
					})}
				</div>
			) : (
				<div className="flex-1 flex items-center justify-center py-4">
					<p className="text-xs text-muted-foreground">
						{t("projects.commandCenter.noRecentActivity")}
					</p>
				</div>
			)}
		</div>
	);
}
