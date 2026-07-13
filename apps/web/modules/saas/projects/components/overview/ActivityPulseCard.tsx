"use client";

import { chartColor } from "@saas/shared/lib/chart-colors";
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
		color: chartColor(0),
	},
	photos: {
		label: "Photos",
		color: chartColor(1),
	},
	issues: {
		label: "Issues",
		color: chartColor(2),
	},
};

export function ActivityPulseCard() {
	const t = useTranslations();

	return (
		<div className="rounded-2xl border-2 bg-card p-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-chart-4/15 p-2">
						<Activity className="h-4 w-4 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("projects.commandCenter.activityPulse")}
					</h3>
				</div>
				<span className="text-xs font-semibold text-chart-4 bg-chart-4/15 px-2.5 py-0.5 rounded-full">
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
						fill={chartColor(0)}
						radius={[0, 0, 0, 0]}
					/>
					<Bar
						dataKey="photos"
						stackId="a"
						fill={chartColor(1)}
						radius={[0, 0, 0, 0]}
					/>
					<Bar
						dataKey="issues"
						stackId="a"
						fill={chartColor(2)}
						radius={[2, 2, 0, 0]}
					/>
				</BarChart>
			</ChartContainer>

			{/* Legend */}
			<div className="flex items-center justify-center gap-4 mt-2">
				<div className="flex items-center gap-1.5">
					<div
						className="h-2 w-2 rounded-full"
						style={{ backgroundColor: chartColor(0) }}
					/>
					<span className="text-[10px] text-muted-foreground">
						{t("projects.commandCenter.reports")}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="h-2 w-2 rounded-full"
						style={{ backgroundColor: chartColor(1) }}
					/>
					<span className="text-[10px] text-muted-foreground">
						{t("projects.commandCenter.photos")}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="h-2 w-2 rounded-full"
						style={{ backgroundColor: chartColor(2) }}
					/>
					<span className="text-[10px] text-muted-foreground">
						{t("projects.commandCenter.issues")}
					</span>
				</div>
			</div>
		</div>
	);
}
