"use client";

import { useTranslations } from "next-intl";

interface LookaheadSummaryProps {
	totalActivities: number;
	criticalActivities: number;
	completedActivities: number;
	delayedActivities: number;
}

export function LookaheadSummary({
	totalActivities,
	criticalActivities,
	completedActivities,
	delayedActivities,
}: LookaheadSummaryProps) {
	const t = useTranslations();

	const stats = [
		{
			label: t("execution.lookahead.summary.totalActivities"),
			value: totalActivities,
			color: "text-foreground",
		},
		{
			label: t("execution.lookahead.summary.criticalActivities"),
			value: criticalActivities,
			color: "text-destructive",
		},
		{
			label: t("execution.lookahead.summary.completedActivities"),
			value: completedActivities,
			color: "text-success",
		},
		{
			label: t("execution.lookahead.summary.delayedActivities"),
			value: delayedActivities,
			color: "text-chart-1",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-2xl border-2 bg-card p-3 text-center"
				>
					<div className={`text-2xl font-bold ${stat.color}`}>
						{stat.value}
					</div>
					<div className="text-xs text-muted-foreground mt-1">
						{stat.label}
					</div>
				</div>
			))}
		</div>
	);
}
