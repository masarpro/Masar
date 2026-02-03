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
			return <Sun className="h-4 w-4 text-amber-500" />;
		case "CLOUDY":
			return <Cloud className="h-4 w-4 text-slate-500" />;
		case "RAINY":
			return <CloudRain className="h-4 w-4 text-blue-500" />;
		case "WINDY":
		case "DUSTY":
			return <Wind className="h-4 w-4 text-slate-500" />;
		case "COLD":
			return <Thermometer className="h-4 w-4 text-cyan-500" />;
		default:
			return <Sun className="h-4 w-4 text-amber-500" />;
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
		<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
			{/* Header */}
			<div className="mb-4 flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
						>
							{t("projects.field.dailyReport")}
						</Badge>
						<div className="flex items-center gap-1 text-sm text-slate-500">
							{getWeatherIcon(weather)}
							<span>{t(`projects.field.weather.${weather}`)}</span>
						</div>
					</div>
					<h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
						{formatDate(reportDate)}
					</h3>
				</div>
				<div className="text-right text-sm text-slate-500">
					<span>{createdBy?.name}</span>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-4 grid grid-cols-2 gap-3">
				<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
					<p className="text-xs text-slate-500">
						{t("projects.field.manpower")}
					</p>
					<p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
						{manpower} {t("projects.field.workers")}
					</p>
				</div>
				{equipment && (
					<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
						<p className="text-xs text-slate-500">
							{t("projects.field.equipment")}
						</p>
						<p className="text-sm text-slate-700 dark:text-slate-300">
							{equipment}
						</p>
					</div>
				)}
			</div>

			{/* Work Done */}
			<div className="mb-4">
				<h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
					{t("projects.field.workDone")}
				</h4>
				<p className="text-sm text-slate-600 dark:text-slate-400">{workDone}</p>
			</div>

			{/* Blockers */}
			{blockers && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
					<h4 className="mb-1 text-sm font-medium text-amber-700 dark:text-amber-400">
						{t("projects.field.blockers")}
					</h4>
					<p className="text-sm text-amber-600 dark:text-amber-300">
						{blockers}
					</p>
				</div>
			)}
		</div>
	);
}
