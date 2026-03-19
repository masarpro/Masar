"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface PricingPipelineChartProps {
	pipeline: {
		studies: number;
		quotationsSent: number;
		leadsWon: number;
		contracted: number;
	};
}

const chartConfig: ChartConfig = {
	value: {
		label: "العدد",
		color: "hsl(var(--primary))",
	},
};

export function PricingPipelineChart({ pipeline }: PricingPipelineChartProps) {
	const t = useTranslations();

	const data = [
		{
			stage: t("pricing.dashboard.pipeline.studies"),
			value: pipeline.studies,
			fill: "#0ea5e9",
		},
		{
			stage: t("pricing.dashboard.pipeline.quotationsSent"),
			value: pipeline.quotationsSent,
			fill: "#6366f1",
		},
		{
			stage: t("pricing.dashboard.pipeline.leadsWon"),
			value: pipeline.leadsWon,
			fill: "#8b5cf6",
		},
		{
			stage: t("pricing.dashboard.pipeline.contracted"),
			value: pipeline.contracted,
			fill: "#10b981",
		},
	];

	return (
		<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
					{t("pricing.dashboard.pipeline.title")}
				</h3>
			</div>
			<ChartContainer config={chartConfig} className="h-40 w-full">
				<BarChart
					accessibilityLayer
					data={data}
					margin={{ top: 0, right: 5, left: 5, bottom: 20 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="stage"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						fontSize={11}
					/>
					<ChartTooltip
						content={<ChartTooltipContent />}
					/>
					<Bar
						dataKey="value"
						radius={[6, 6, 0, 0]}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
