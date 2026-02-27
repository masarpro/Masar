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
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{[...Array(4)].map((_, i) => (
					<Card key={i} className="animate-pulse">
						<CardContent className="p-4">
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
			color: "text-teal-600",
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
			showProgress: true,
			progress: health.overallProgress,
		},
		{
			label: t("execution.health.milestonesCompleted"),
			value: `${health.milestones.completed} / ${health.milestones.total}`,
			icon: CheckCircleIcon,
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			label: t("execution.health.delayedCount"),
			value: String(health.milestones.delayed),
			icon: AlertTriangleIcon,
			color: health.milestones.delayed > 0 ? "text-red-600" : "text-green-600",
			bgColor: health.milestones.delayed > 0
				? "bg-red-50 dark:bg-red-950/30"
				: "bg-green-50 dark:bg-green-950/30",
			highlight: health.milestones.delayed > 0,
		},
		{
			label: t("execution.health.nextMilestone"),
			value: health.upcomingMilestone
				? t("execution.health.daysUntil", { days: health.upcomingMilestone.daysUntil })
				: t("execution.health.noUpcoming"),
			icon: CalendarIcon,
			color: "text-purple-600",
			bgColor: "bg-purple-50 dark:bg-purple-950/30",
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{stats.map((stat) => (
				<Card
					key={stat.label}
					className={`${stat.bgColor} border-0 backdrop-blur-sm ${stat.highlight ? "ring-2 ring-red-200 dark:ring-red-800" : ""}`}
				>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 mb-1">
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
							<span className="text-xs text-muted-foreground">
								{stat.label}
							</span>
						</div>
						<p className={`text-2xl font-bold ${stat.color}`}>
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
