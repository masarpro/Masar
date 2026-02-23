"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, XAxis } from "recharts";

// Mock data for 7-day activity pulse
// TODO: Connect to real activity API
const mockActivityData = [
	{ day: "Sat", reports: 3, photos: 5, issues: 1 },
	{ day: "Sun", reports: 2, photos: 8, issues: 0 },
	{ day: "Mon", reports: 4, photos: 6, issues: 2 },
	{ day: "Tue", reports: 1, photos: 4, issues: 1 },
	{ day: "Wed", reports: 3, photos: 7, issues: 0 },
	{ day: "Thu", reports: 5, photos: 9, issues: 3 },
	{ day: "Fri", reports: 2, photos: 3, issues: 1 },
];

const totalInteractions = mockActivityData.reduce(
	(sum, d) => sum + d.reports + d.photos + d.issues,
	0,
);

const chartConfig: ChartConfig = {
	reports: {
		label: "Reports",
		color: "#3b82f6",
	},
	photos: {
		label: "Photos",
		color: "#8b5cf6",
	},
	issues: {
		label: "Issues",
		color: "#f59e0b",
	},
};

export function ActivityPulseCard() {
	const t = useTranslations();

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-2">
						<Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						{t("projects.commandCenter.activityPulse")}
					</h3>
				</div>
				<span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-1 rounded-full">
					{totalInteractions} {t("projects.commandCenter.totalInteractions")}
				</span>
			</div>

			{/* Chart */}
			<ChartContainer config={chartConfig} className="h-24 w-full">
				<BarChart
					accessibilityLayer
					data={mockActivityData}
					margin={{ top: 0, right: 0, left: 0, bottom: 10 }}
				>
					<XAxis
						dataKey="day"
						tickLine={false}
						axisLine={false}
						tickMargin={4}
						fontSize={10}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<Bar
						dataKey="reports"
						stackId="a"
						fill="#3b82f6"
						radius={[0, 0, 0, 0]}
					/>
					<Bar
						dataKey="photos"
						stackId="a"
						fill="#8b5cf6"
						radius={[0, 0, 0, 0]}
					/>
					<Bar
						dataKey="issues"
						stackId="a"
						fill="#f59e0b"
						radius={[2, 2, 0, 0]}
					/>
				</BarChart>
			</ChartContainer>

			{/* Legend */}
			<div className="flex items-center justify-center gap-4 mt-2">
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 rounded-full bg-blue-500" />
					<span className="text-[10px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.reports")}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 rounded-full bg-violet-500" />
					<span className="text-[10px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.photos")}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="h-2 w-2 rounded-full bg-amber-500" />
					<span className="text-[10px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.issues")}
					</span>
				</div>
			</div>
		</div>
	);
}
