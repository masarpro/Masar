"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

// S-curve data with actual values only up to current month (M5)
const S_CURVE_DATA = [
	{ period: "M1", planned: 2, actual: 1 },
	{ period: "M2", planned: 6, actual: 5 },
	{ period: "M3", planned: 12, actual: 10 },
	{ period: "M4", planned: 22, actual: 18 },
	{ period: "M5", planned: 35, actual: 30 },
	{ period: "M6", planned: 50, actual: null },
	{ period: "M7", planned: 65, actual: null },
	{ period: "M8", planned: 78, actual: null },
	{ period: "M9", planned: 88, actual: null },
	{ period: "M10", planned: 95, actual: null },
	{ period: "M11", planned: 99, actual: null },
	{ period: "M12", planned: 100, actual: null },
];

const chartConfig: ChartConfig = {
	planned: { label: "المخطط", color: "#3b82f6" },
	actual: { label: "الفعلي", color: "#14b8a6" },
};

interface TimelineScheduleCardProps {
	projectProgress?: number;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
}

export function TimelineScheduleCard({
	projectProgress = 30,
	startDate,
	endDate,
}: TimelineScheduleCardProps) {
	const t = useTranslations();

	// Calculate days remaining
	const end = endDate ? new Date(endDate) : null;
	const now = new Date();
	const daysRemaining = end
		? Math.max(
				0,
				Math.ceil(
					(end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				),
			)
		: 0;

	// Format dates in Arabic
	const formatDate = (d: Date | string | null | undefined) => {
		if (!d) return "—";
		return new Date(d).toLocaleDateString("ar-SA", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	// Status from variance
	const currentPlanned = S_CURVE_DATA[4]?.planned ?? 35;
	const variance = projectProgress - currentPlanned;
	const isOnTrack = variance >= -5;

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40">
						<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
						{t("projects.commandCenter.timeline")}
					</h3>
				</div>
				<span
					className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
						isOnTrack
							? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
							: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
					}`}
				>
					<span
						className={`h-1.5 w-1.5 animate-pulse rounded-full ${isOnTrack ? "bg-emerald-500" : "bg-amber-500"}`}
					/>
					{isOnTrack
						? t("projects.commandCenter.onTrack")
						: t("projects.commandCenter.atRisk")}
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3 p-5">
				{/* Legend Row */}
				<div className="flex items-center gap-3.5">
					<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
						<span className="inline-block h-[3px] w-5 rounded-full border-[1.5px] border-dashed border-blue-500 bg-transparent" />
						{t("projects.commandCenter.plannedProgress")}
					</div>
					<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
						<span className="inline-block h-[3px] w-5 rounded-full bg-teal-500" />
						{t("projects.commandCenter.actualProgress")}
					</div>
					<span className="mr-auto text-[11px] text-slate-400">
						{t("projects.commandCenter.achievement")}:{" "}
						<strong className="text-emerald-500">
							{projectProgress}%
						</strong>
					</span>
				</div>

				{/* S-Curve Chart */}
				<ChartContainer
					config={chartConfig}
					className="h-[160px] w-full"
				>
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
							fontSize={9}
							tick={{ fill: "currentColor" }}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={4}
							fontSize={9}
							tickFormatter={(v) => `${v}%`}
							domain={[0, 100]}
							width={32}
							tick={{ fill: "currentColor" }}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value: number | string) =>
										`${value}%`
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
							connectNulls={false}
						/>
					</LineChart>
				</ChartContainer>

				{/* Timeline Progress Bar */}
				<div className="mt-1">
					<div className="flex items-center gap-2.5">
						<span className="text-[11px] font-semibold text-teal-600">
							{projectProgress}%
						</span>
						<div className="relative h-[7px] flex-1 overflow-visible rounded-full bg-slate-200 dark:bg-slate-700">
							<div
								className="h-full rounded-full bg-gradient-to-l from-teal-500 to-blue-500"
								style={{
									width: `${projectProgress}%`,
								}}
							/>
							{/* Progress indicator dot */}
							<div
								className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-teal-500 shadow-md dark:border-slate-900"
								style={{
									left: `${projectProgress}%`,
									transform: `translateX(-50%) translateY(-50%)`,
								}}
							/>
						</div>
						<span className="text-[11px] font-semibold text-slate-400">
							100%
						</span>
					</div>
					<div className="mt-1 flex justify-between">
						<span className="text-[9px] text-slate-400">
							{formatDate(startDate)}
						</span>
						<span className="text-[9px] text-slate-400">
							{formatDate(endDate)}
						</span>
					</div>
				</div>

				{/* Bottom Stats */}
				<div className="mt-auto grid grid-cols-3 gap-1.5">
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-center dark:border-slate-800 dark:bg-slate-800/50">
						<div
							className="text-base font-bold text-teal-600"
							dir="ltr"
						>
							{daysRemaining}
						</div>
						<div className="text-[9px] text-slate-400">
							{t("projects.commandCenter.daysRemaining")}
						</div>
					</div>
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-center dark:border-slate-800 dark:bg-slate-800/50">
						<div
							className="text-base font-bold text-blue-500"
							dir="ltr"
						>
							{projectProgress}%
						</div>
						<div className="text-[9px] text-slate-400">
							{t("projects.commandCenter.actualProgress")}
						</div>
					</div>
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-center dark:border-slate-800 dark:bg-slate-800/50">
						<div
							className="text-base font-bold text-slate-500 dark:text-slate-400"
							dir="ltr"
						>
							100%
						</div>
						<div className="text-[9px] text-slate-400">
							{t("projects.commandCenter.plannedProgress")}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
