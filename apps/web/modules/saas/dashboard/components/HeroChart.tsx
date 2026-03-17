"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig: ChartConfig = {
	income: { label: "المقبوضات", color: "#10b981" },
	expense: { label: "المصروفات", color: "#f43f5e" },
};

export interface ChartDataPoint {
	day: string;
	income: number;
	expense: number;
}

interface HeroChartProps {
	chartData: ChartDataPoint[] | null;
	organizationSlug: string;
}

export function HeroChart({ chartData, organizationSlug }: HeroChartProps) {
	const t = useTranslations();
	const hasData = chartData && chartData.length > 1;

	return (
		<div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h3 className="text-sm font-bold text-foreground">
						{t("dashboard.cashFlow.title")}
					</h3>
				</div>
				<div className="flex gap-3 text-[11px]">
					<span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
						<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
						{t("dashboard.cashFlow.income")}
					</span>
					<span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
						<span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
						{t("dashboard.cashFlow.expenses")}
					</span>
				</div>
			</div>

			{/* Chart */}
			<div className="min-h-0 flex-1">
				{hasData ? (
					<ChartContainer
						config={chartConfig}
						className="h-full w-full min-h-[160px]"
					>
						<AreaChart
							data={chartData}
							margin={{
								top: 5,
								right: 5,
								left: 0,
								bottom: 5,
							}}
						>
							<defs>
								<linearGradient
									id="heroIncomeGrad"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="0%"
										stopColor="#10b981"
										stopOpacity={0.15}
									/>
									<stop
										offset="100%"
										stopColor="#10b981"
										stopOpacity={0.01}
									/>
								</linearGradient>
								<linearGradient
									id="heroExpenseGrad"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="0%"
										stopColor="#f43f5e"
										stopOpacity={0.08}
									/>
									<stop
										offset="100%"
										stopColor="#f43f5e"
										stopOpacity={0.01}
									/>
								</linearGradient>
							</defs>

							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
							/>
							<XAxis
								dataKey="day"
								tick={{ fontSize: 10, fill: "#9ca3af" }}
								axisLine={false}
								tickLine={false}
								tickMargin={4}
							/>
							<YAxis hide />
							<ChartTooltip
								content={<ChartTooltipContent />}
							/>

							<Area
								type="monotone"
								dataKey="income"
								stroke="#10b981"
								strokeWidth={2.5}
								fill="url(#heroIncomeGrad)"
								dot={false}
							/>
							<Area
								type="monotone"
								dataKey="expense"
								stroke="#f43f5e"
								strokeWidth={1.5}
								fill="url(#heroExpenseGrad)"
								strokeDasharray="6 4"
								dot={false}
							/>
						</AreaChart>
					</ChartContainer>
				) : (
					<div className="flex h-full flex-col items-center justify-center">
						<BarChart3 className="mb-3 h-10 w-10 text-gray-200 dark:text-gray-700" />
						<p className="text-sm text-gray-400 dark:text-gray-500">
							{t("dashboard.cashflow.empty")}
						</p>
						<Link
							href={`/app/${organizationSlug}/finance/invoices/new`}
							className="mt-2 text-xs text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
						>
							{t("dashboard.cashflow.emptyCta")}{" "}
							<ChevronLeft className="inline h-3 w-3" />
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
