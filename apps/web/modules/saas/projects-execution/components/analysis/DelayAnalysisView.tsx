"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDateShort } from "../../lib/gantt-utils";

interface DelayItem {
	activityId: string;
	activityTitle: string;
	milestoneName: string;
	plannedEnd: string | Date | null;
	actualEnd: string | Date | null;
	delayDays: number;
}

interface DelayAnalysisViewProps {
	data: DelayItem[];
}

export function DelayAnalysisView({ data }: DelayAnalysisViewProps) {
	const t = useTranslations();
	const locale = useLocale();

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-[200px] text-muted-foreground">
				{t("execution.analysis.delay.noDelays")}
			</div>
		);
	}

	// Sort by delay days descending
	const sorted = [...data].sort((a, b) => b.delayDays - a.delayDays);

	return (
		<div className="space-y-4">
			{/* Summary bar */}
			<div className="flex items-center gap-4 text-sm">
				<span className="font-medium">
					{data.length} {t("execution.analysis.delay.title")}
				</span>
				<span className="text-muted-foreground">
					{t("execution.analysis.delay.byMilestone")}
				</span>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-3 py-2 text-start font-medium">
								{t("execution.analysis.delay.activity")}
							</th>
							<th className="px-3 py-2 text-start font-medium">
								{t("execution.analysis.delay.milestone")}
							</th>
							<th className="px-3 py-2 text-start font-medium">
								{t("execution.analysis.delay.plannedEnd")}
							</th>
							<th className="px-3 py-2 text-start font-medium">
								{t("execution.analysis.delay.actualEnd")}
							</th>
							<th className="px-3 py-2 text-center font-medium">
								{t("execution.analysis.delay.delayDays")}
							</th>
						</tr>
					</thead>
					<tbody>
						{sorted.map((item) => (
							<tr key={item.activityId} className="border-b">
								<td className="px-3 py-2">{item.activityTitle}</td>
								<td className="px-3 py-2 text-muted-foreground">
									{item.milestoneName}
								</td>
								<td className="px-3 py-2">
									{formatDateShort(item.plannedEnd, locale)}
								</td>
								<td className="px-3 py-2">
									{formatDateShort(item.actualEnd, locale)}
								</td>
								<td className="px-3 py-2 text-center">
									<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
										+{item.delayDays}d
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
