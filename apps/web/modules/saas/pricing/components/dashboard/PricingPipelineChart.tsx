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
		color: "var(--primary)",
	},
};

export function PricingPipelineChart({ pipeline }: PricingPipelineChartProps) {
	const t = useTranslations();

	const data = [
		{
			stage: t("pricing.dashboard.pipeline.studies"),
			value: pipeline.studies,
			fill: "var(--chart-1)",
		},
		{
			stage: t("pricing.dashboard.pipeline.quotationsSent"),
			value: pipeline.quotationsSent,
			fill: "var(--chart-5)",
		},
		{
			stage: t("pricing.dashboard.pipeline.leadsWon"),
			value: pipeline.leadsWon,
			fill: "var(--chart-2)",
		},
		{
			stage: t("pricing.dashboard.pipeline.contracted"),
			value: pipeline.contracted,
			fill: "var(--success)",
		},
	];

	return (
		<div className="flex h-full min-h-0 flex-col bg-card border-2 rounded-3xl p-6">
			<div className="flex shrink-0 items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-card-foreground">
					{t("pricing.dashboard.pipeline.title")}
				</h3>
			</div>
			<ChartContainer
				config={chartConfig}
				className="h-40 w-full lg:h-auto lg:min-h-0 lg:flex-1"
			>
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
						radius={[10, 10, 10, 10]}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
