"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatCurrency } from "../../lib/utils";

// Mock data for sparkline chart
// TODO: Connect to real cash flow API
const mockCashFlowData = [
	{ day: "السبت", amount: 45000 },
	{ day: "الأحد", amount: 52000 },
	{ day: "الإثنين", amount: 48000 },
	{ day: "الثلاثاء", amount: 61000 },
	{ day: "الأربعاء", amount: 55000 },
	{ day: "الخميس", amount: 67000 },
	{ day: "الجمعة", amount: 72000 },
];

const chartConfig: ChartConfig = {
	amount: {
		label: "التدفق النقدي",
		color: "hsl(var(--primary))",
	},
};

export function CashFlowCard() {
	const t = useTranslations();

	return (
		<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
					{t("finance.dashboard.overview.cashFlow")}
				</h3>
				<span className="text-xs text-slate-500 dark:text-slate-400">
					{t("finance.dashboard.overview.last7Days")}
				</span>
			</div>
			<ChartContainer config={chartConfig} className="h-32 w-full">
				<AreaChart
					accessibilityLayer
					data={mockCashFlowData}
					margin={{ top: 0, right: 5, left: 5, bottom: 20 }}
				>
					<defs>
						<linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="0%"
								stopColor="#14b8a6"
								stopOpacity={0.4}
							/>
							<stop
								offset="100%"
								stopColor="#14b8a6"
								stopOpacity={0}
							/>
						</linearGradient>
					</defs>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="day"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						fontSize={10}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value: number | string) => formatCurrency(Number(value))}
							/>
						}
					/>
					<Area
						dataKey="amount"
						type="natural"
						fill="url(#cashFlowGradient)"
						stroke="#14b8a6"
						strokeWidth={2}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
