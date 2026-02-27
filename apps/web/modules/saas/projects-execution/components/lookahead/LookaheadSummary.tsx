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
			color: "text-red-500",
		},
		{
			label: t("execution.lookahead.summary.completedActivities"),
			value: completedActivities,
			color: "text-green-500",
		},
		{
			label: t("execution.lookahead.summary.delayedActivities"),
			value: delayedActivities,
			color: "text-amber-500",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-lg border p-3 text-center"
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
