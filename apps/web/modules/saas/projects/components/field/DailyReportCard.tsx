"use client";

import { Badge } from "@ui/components/badge";
import { Cloud, CloudRain, Sun, Thermometer, Wind } from "lucide-react";
import { useTranslations } from "next-intl";

interface DailyReportCardProps {
	report: Record<string, unknown>;
}

function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat("ar-SA", {
		weekday: "long",
		day: "numeric",
		month: "long",
	}).format(new Date(date));
}

function getWeatherIcon(weather: string) {
	switch (weather) {
		case "SUNNY":
		case "HOT":
			return <Sun className="h-4 w-4 text-chart-1" />;
		case "CLOUDY":
			return <Cloud className="h-4 w-4 text-muted-foreground" />;
		case "RAINY":
			return <CloudRain className="h-4 w-4 text-chart-4" />;
		case "WINDY":
		case "DUSTY":
			return <Wind className="h-4 w-4 text-muted-foreground" />;
		case "COLD":
			return <Thermometer className="h-4 w-4 text-chart-4" />;
		default:
			return <Sun className="h-4 w-4 text-chart-1" />;
	}
}

export function DailyReportCard({ report }: DailyReportCardProps) {
	const t = useTranslations();

	const reportDate = report.reportDate as string;
	const manpower = report.manpower as number;
	const equipment = report.equipment as string | undefined;
	const workDone = report.workDone as string;
	const blockers = report.blockers as string | undefined;
	const weather = report.weather as string;
	const createdBy = report.createdBy as { name: string; image?: string };

	return (
		<div className="rounded-2xl border-2 bg-card p-5">
			{/* Header */}
			<div className="mb-4 flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className="bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4"
						>
							{t("projects.field.dailyReport")}
						</Badge>
						<div className="flex items-center gap-1 text-sm text-muted-foreground">
							{getWeatherIcon(weather)}
							<span>{t(`projects.field.weather.${weather}`)}</span>
						</div>
					</div>
					<h3 className="mt-2 text-lg font-semibold text-card-foreground">
						{formatDate(reportDate)}
					</h3>
				</div>
				<div className="text-start text-sm text-muted-foreground">
					<span>{createdBy?.name}</span>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-4 grid grid-cols-2 gap-3">
				<div className="rounded-xl bg-muted p-3">
					<p className="text-xs text-muted-foreground">
						{t("projects.field.manpower")}
					</p>
					<p className="text-lg font-semibold text-card-foreground">
						{manpower} {t("projects.field.workers")}
					</p>
				</div>
				{equipment && (
					<div className="rounded-xl bg-muted p-3">
						<p className="text-xs text-muted-foreground">
							{t("projects.field.equipment")}
						</p>
						<p className="text-sm text-foreground">
							{equipment}
						</p>
					</div>
				)}
			</div>

			{/* Work Done */}
			<div className="mb-4">
				<h4 className="mb-2 text-sm font-medium text-foreground">
					{t("projects.field.workDone")}
				</h4>
				<p className="text-sm text-muted-foreground">{workDone}</p>
			</div>

			{/* Blockers */}
			{blockers && (
				<div className="rounded-xl border border-chart-1/30 bg-chart-1/10 p-3">
					<h4 className="mb-1 text-sm font-medium text-chart-1">
						{t("projects.field.blockers")}
					</h4>
					<p className="text-sm text-foreground">
						{blockers}
					</p>
				</div>
			)}
		</div>
	);
}
