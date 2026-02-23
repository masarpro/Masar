"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

// S-curve data: نموذج عالمي - بداية بطيئة، تسارع في المنتصف، تباطؤ عند النهاية
// Industry standard: slow start, acceleration in middle, slowdown at completion
const S_CURVE_DATA = [
	{ period: "M1", planned: 2, actual: 1 },
	{ period: "M2", planned: 6, actual: 5 },
	{ period: "M3", planned: 12, actual: 10 },
	{ period: "M4", planned: 22, actual: 18 },
	{ period: "M5", planned: 35, actual: 30 },
	{ period: "M6", planned: 50, actual: 45 },
	{ period: "M7", planned: 65, actual: 58 },
	{ period: "M8", planned: 78, actual: 70 },
	{ period: "M9", planned: 88, actual: 82 },
	{ period: "M10", planned: 95, actual: 90 },
	{ period: "M11", planned: 99, actual: 96 },
	{ period: "M12", planned: 100, actual: 100 },
];

const chartConfig: ChartConfig = {
	planned: {
		label: "المخطط",
		color: "#3b82f6",
	},
	actual: {
		label: "الفعلي",
		color: "#14b8a6",
	},
};

type ProjectStatus = "on_track" | "at_risk" | "delayed";

function getStatusFromVariance(planned: number, actual: number): ProjectStatus {
	const variance = actual - planned;
	if (variance >= 0) return "on_track";
	if (variance >= -5) return "at_risk";
	return "delayed";
}

interface ProjectStatusChartProps {
	projectProgress?: number;
}

export function ProjectStatusChart({ projectProgress }: ProjectStatusChartProps) {
	const t = useTranslations();

	// آخر نقطة بيانات لتحديد الحالة
	const lastData = S_CURVE_DATA[S_CURVE_DATA.length - 1];
	const status = getStatusFromVariance(lastData.planned, lastData.actual);

	const statusConfig: Record<
		ProjectStatus,
		{ label: string; className: string; dotColor: string }
	> = {
		on_track: {
			label: t("projects.commandCenter.onTrack"),
			className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
			dotColor: "bg-emerald-500",
		},
		at_risk: {
			label: t("projects.commandCenter.atRisk"),
			className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
			dotColor: "bg-amber-500",
		},
		delayed: {
			label: t("projects.commandCenter.delayed"),
			className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
			dotColor: "bg-red-500",
		},
	};

	const statusStyle = statusConfig[status];

	return (
		<div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50 sm:p-6">
			{/* Header: Title + Status Badge + Completion */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
						<Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						{t("projects.commandCenter.projectStatusChart")}
					</h3>
				</div>
				<div className="flex items-center gap-3">
					{/* Status Badge - Industry standard indicator */}
					<span
						className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.className}`}
					>
						<span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotColor}`} />
						{statusStyle.label}
					</span>
					{projectProgress !== undefined && (
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("projects.commandCenter.completion")}: {Math.round(projectProgress)}%
						</span>
					)}
				</div>
			</div>

			{/* Legend */}
			<div className="mb-3 flex items-center gap-4 text-xs">
				<div className="flex items-center gap-2">
					<div className="h-0.5 w-6 rounded-full border-2 border-dashed border-blue-500" />
					<span className="text-slate-600 dark:text-slate-400">
						{t("projects.commandCenter.plannedProgress")}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-0.5 w-6 rounded-full bg-teal-500" />
					<span className="text-slate-600 dark:text-slate-400">
						{t("projects.commandCenter.actualProgress")}
					</span>
				</div>
			</div>

			{/* S-Curve Chart */}
			<ChartContainer config={chartConfig} className="h-44 w-full sm:h-52">
				<LineChart
					accessibilityLayer
					data={S_CURVE_DATA}
					margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						className="stroke-slate-200 dark:stroke-slate-700"
					/>
					<XAxis
						dataKey="period"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						fontSize={10}
						tick={{ fill: "currentColor" }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={4}
						fontSize={10}
						tickFormatter={(v) => `${v}%`}
						domain={[0, 100]}
						width={32}
						tick={{ fill: "currentColor" }}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value: number | string) => `${value}%`}
								labelFormatter={(label) =>
									`${t("projects.commandCenter.scheduleSnapshot")} - ${label}`
								}
							/>
						}
					/>
					<Line
						type="monotone"
						dataKey="planned"
						stroke="#3b82f6"
						strokeWidth={2}
						strokeDasharray="5 4"
						dot={false}
						activeDot={{ r: 4, strokeWidth: 2 }}
						connectNulls
					/>
					<Line
						type="monotone"
						dataKey="actual"
						stroke="#14b8a6"
						strokeWidth={2.5}
						dot={false}
						activeDot={{ r: 4, strokeWidth: 2 }}
						connectNulls
					/>
				</LineChart>
			</ChartContainer>

			{/* Footer: Variance indicator */}
			<div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
				<span className="text-slate-500 dark:text-slate-400">
					{t("projects.commandCenter.timelineChart")}
				</span>
				<span className="text-slate-600 dark:text-slate-300">
					{lastData.actual}% {t("projects.commandCenter.actualProgress")} /{" "}
					{lastData.planned}% {t("projects.commandCenter.plannedProgress")}
				</span>
			</div>
		</div>
	);
}
