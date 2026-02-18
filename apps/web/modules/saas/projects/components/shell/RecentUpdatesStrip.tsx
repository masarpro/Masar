"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Camera, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

interface RecentUpdatesStripProps {
	organizationId: string;
	projectId: string;
}

const typeIcons: Record<string, typeof FileText> = {
	DAILY_REPORT: FileText,
	ISSUE: AlertTriangle,
	PHOTO: Camera,
	PROGRESS_UPDATE: TrendingUp,
};

const typeColors: Record<string, string> = {
	DAILY_REPORT: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
	ISSUE: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
	PHOTO: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
	PROGRESS_UPDATE: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
};

export const RecentUpdatesStrip = memo(function RecentUpdatesStrip({
	organizationId,
	projectId,
}: RecentUpdatesStripProps) {
	const t = useTranslations();

	const { data: fieldData } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 10,
			},
		}),
	);

	const timeline = fieldData?.timeline ?? [];

	if (timeline.length === 0) return null;

	return (
		<div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
			<div className="px-4 py-3 sm:px-6">
				<div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
					{timeline.map((item: any) => {
						const Icon = typeIcons[item.type] ?? FileText;
						const colorClass =
							typeColors[item.type] ??
							"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";

						return (
							<div
								key={item.id}
								className="shrink-0 flex items-center gap-2.5 rounded-xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 shadow-sm px-3 py-2 transition-all hover:shadow-md"
							>
								<div
									className={`rounded-lg p-1.5 ${colorClass}`}
								>
									<Icon className="h-3.5 w-3.5" />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
										{item.type === "DAILY_REPORT"
											? t("projects.field.dailyReport")
											: item.type === "ISSUE"
												? t("projects.field.issue")
												: item.type === "PHOTO"
													? t("projects.field.photo")
													: t("projects.field.progressUpdate")}
									</p>
									<p className="text-[10px] text-slate-400">
										{new Date(
											item.createdAt,
										).toLocaleDateString("ar-SA", {
											day: "numeric",
											month: "short",
										})}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
});
