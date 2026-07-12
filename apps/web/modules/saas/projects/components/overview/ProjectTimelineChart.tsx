"use client";

import {
	CHART_PALETTE,
	CHART_SEMANTIC,
} from "@saas/shared/lib/chart-colors";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// Mock data for project timeline progress
// TODO: Connect to real project progress API
const mockTimelineData = [
	{ month: "Jan", planned: 5, actual: 4 },
	{ month: "Feb", planned: 12, actual: 10 },
	{ month: "Mar", planned: 22, actual: 19 },
	{ month: "Apr", planned: 35, actual: 30 },
	{ month: "May", planned: 48, actual: 42 },
	{ month: "Jun", planned: 60, actual: 55 },
	{ month: "Jul", planned: 72, actual: 65 },
	{ month: "Aug", planned: 82, actual: null },
	{ month: "Sep", planned: 90, actual: null },
	{ month: "Oct", planned: 100, actual: null },
];

const chartConfig: ChartConfig = {
	planned: {
		label: "Planned",
		color: CHART_SEMANTIC.primary,
	},
	actual: {
		label: "Actual",
		color: CHART_PALETTE[0],
	},
};

interface ProjectTimelineChartProps {
	projectProgress: number;
}

export function ProjectTimelineChart({
	projectProgress,
}: ProjectTimelineChartProps) {
	const t = useTranslations();

	return (
		<div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/70 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/30 dark:bg-slate-900/70 sm:p-6">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-chart-4/15 p-2 dark:bg-chart-4/20">
						<Calendar className="h-4 w-4 text-chart-4 dark:text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						{t("projects.commandCenter.timelineChart")}
					</h3>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div
							className="h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: CHART_SEMANTIC.primary }}
						/>
						<span className="text-[10px] text-slate-500 dark:text-slate-400">
							{t("projects.commandCenter.plannedProgress")}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<div
							className="h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: CHART_PALETTE[0] }}
						/>
						<span className="text-[10px] text-slate-500 dark:text-slate-400">
							{t("projects.commandCenter.actualProgress")}
						</span>
					</div>
				</div>
			</div>

			<div className="min-h-0 flex-1">
				<ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
					<AreaChart
						accessibilityLayer
						data={mockTimelineData}
						margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
					>
						<defs>
							<linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={CHART_SEMANTIC.primary} stopOpacity={0.3} />
								<stop offset="100%" stopColor={CHART_SEMANTIC.primary} stopOpacity={0} />
							</linearGradient>
							<linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={CHART_PALETTE[0]} stopOpacity={0.3} />
								<stop offset="100%" stopColor={CHART_PALETTE[0]} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							fontSize={10}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={4}
							fontSize={10}
							tickFormatter={(v) => `${v}%`}
							domain={[0, 100]}
							width={35}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value: number | string) => `${value}%`}
								/>
							}
						/>
						<Area
							dataKey="planned"
							type="monotone"
							fill="url(#plannedGradient)"
							stroke={CHART_SEMANTIC.primary}
							strokeWidth={2}
							strokeDasharray="5 3"
							connectNulls
						/>
						<Area
							dataKey="actual"
							type="monotone"
							fill="url(#actualGradient)"
							stroke={CHART_PALETTE[0]}
							strokeWidth={2}
							connectNulls
						/>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
