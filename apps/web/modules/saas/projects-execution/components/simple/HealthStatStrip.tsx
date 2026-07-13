"use client";

import { Card, CardContent } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import {
	ActivityIcon,
	AlertTriangleIcon,
	CheckCircleIcon,
	CalendarIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExecutionHealth } from "../../lib/execution-types";

interface HealthStatStripProps {
	health: ExecutionHealth | null;
	isLoading?: boolean;
}

export function HealthStatStrip({ health, isLoading }: HealthStatStripProps) {
	const t = useTranslations();

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
				{[...Array(4)].map((_, i) => (
					<Card key={i} className="animate-pulse">
						<CardContent className="p-2.5 sm:p-4">
							<div className="h-12 bg-muted rounded" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!health) return null;

	const stats = [
		{
			label: t("execution.health.overallProgress"),
			value: `${health.overallProgress}%`,
			icon: ActivityIcon,
			color: "text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			showProgress: true,
			progress: health.overallProgress,
		},
		{
			label: t("execution.health.milestonesCompleted"),
			value: `${health.milestones.completed} / ${health.milestones.total}`,
			icon: CheckCircleIcon,
			color: "text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		},
		{
			label: t("execution.health.delayedCount"),
			value: String(health.milestones.delayed),
			icon: AlertTriangleIcon,
			color: health.milestones.delayed > 0 ? "text-destructive" : "text-success",
			bgColor: health.milestones.delayed > 0
				? "bg-destructive/15"
				: "bg-success/15",
			highlight: health.milestones.delayed > 0,
		},
		{
			label: t("execution.health.nextMilestone"),
			value: health.upcomingMilestone
				? t("execution.health.daysUntil", { days: health.upcomingMilestone.daysUntil })
				: t("execution.health.noUpcoming"),
			icon: CalendarIcon,
			color: "text-chart-4",
			bgColor: "bg-chart-4/15",
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
			{stats.map((stat) => (
				<Card
					key={stat.label}
					className={`border-2 ${stat.highlight ? "border-destructive/40" : ""}`}
				>
					<CardContent className="p-2.5 sm:p-4">
						<div className="flex items-center gap-1.5 sm:gap-2 mb-1">
							<stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${stat.color}`} />
							<span className="truncate text-[11px] sm:text-xs text-muted-foreground">
								{stat.label}
							</span>
						</div>
						<p className={`text-base sm:text-2xl font-bold tabular-nums ${stat.color}`}>
							{stat.value}
						</p>
						{stat.showProgress && (
							<Progress
								value={stat.progress}
								className="h-1.5 mt-2"
							/>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
