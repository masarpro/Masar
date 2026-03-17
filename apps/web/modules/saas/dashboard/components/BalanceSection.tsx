"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Card } from "@ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bar, BarChart, XAxis } from "recharts";

export interface BalanceChartPoint {
	label: string;
	income: number;
	expense: number;
}

interface BalanceSectionProps {
	totalBalance: number;
	totalIncome: number;
	totalExpenses: number;
	chartData: BalanceChartPoint[] | null;
	organizationSlug: string;
}

const chartConfig: ChartConfig = {
	income: { label: "المقبوضات", color: "#10b981" },
	expense: { label: "المصروفات", color: "#f43f5e" },
};

export function BalanceSection({
	totalBalance,
	totalIncome,
	totalExpenses,
	chartData,
	organizationSlug,
}: BalanceSectionProps) {
	const t = useTranslations();
	const hasData = chartData && chartData.length > 1;

	return (
		<Card className="flex h-full flex-col p-6 dark:border-gray-800 dark:bg-gray-900">
			<div className="mb-5 flex items-center justify-between">
				<h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
					{t("dashboard.balance.title")}
				</h3>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
				>
					{t("dashboard.balance.thisMonth")}
				</Link>
			</div>

			<div className="flex flex-1 gap-8">
				{/* Left column: Numbers */}
				<div className="w-44 shrink-0">
					{/* Total balance */}
					<p className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
						<Currency amount={totalBalance} />
					</p>
					<p className="mt-1 text-xs text-gray-400">
						{t("dashboard.balance.total")}
					</p>

					{/* Income */}
					<div className="mt-5 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
							<TrendingUp className="h-4 w-4 text-emerald-500" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-lg font-bold text-gray-900 dark:text-white">
								<Currency amount={totalIncome} />
							</p>
							<p className="text-[11px] text-gray-400">
								{t("dashboard.balance.income")}
							</p>
						</div>
					</div>

					{/* Expenses */}
					<div className="mt-3 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
							<TrendingDown className="h-4 w-4 text-rose-500" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-lg font-bold text-gray-900 dark:text-white">
								<Currency amount={totalExpenses} />
							</p>
							<p className="text-[11px] text-gray-400">
								{t("dashboard.balance.expenses")}
							</p>
						</div>
					</div>
				</div>

				{/* Right column: Bar Chart */}
				<div className="min-w-0 flex-1">
					<p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
						{t("dashboard.balance.history")}
					</p>
					<div className="h-[180px]">
						{hasData ? (
							<ChartContainer
								config={chartConfig}
								className="h-full w-full"
							>
								<BarChart data={chartData}>
									<XAxis
										dataKey="label"
										tick={{
											fontSize: 10,
											fill: "#9ca3af",
										}}
										axisLine={false}
										tickLine={false}
									/>
									<ChartTooltip
										content={<ChartTooltipContent />}
									/>
									<Bar
										dataKey="income"
										fill="#10b981"
										radius={[4, 4, 0, 0]}
										barSize={12}
									/>
									<Bar
										dataKey="expense"
										fill="#f43f5e"
										radius={[4, 4, 0, 0]}
										barSize={12}
										opacity={0.4}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<div className="flex h-full flex-col items-center justify-center">
								<BarChart3 className="mb-2 h-8 w-8 text-gray-200 dark:text-gray-700" />
								<p className="text-xs text-gray-400">
									{t("dashboard.cashflow.empty")}
								</p>
								<Link
									href={`/app/${organizationSlug}/finance/invoices/new`}
									className="mt-1 text-[11px] text-emerald-500 hover:text-emerald-700 dark:text-emerald-400"
								>
									{t("dashboard.cashflow.emptyCta")}
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}
