"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
import {
	CHART_PALETTE,
	CHART_SEMANTIC,
} from "@saas/shared/lib/chart-colors";
import { ChartContainer } from "@ui/components/chart";
import { Receipt } from "lucide-react";

interface ExpensesAnalyticsCardProps {
	expenses: {
		totalActiveExpenses: number;
		totalMonthlyAmount: number;
		totalAnnualAmount: number;
		byCategory: Record<string, number>;
	};
	formatCurrency: (amount: number) => string;
}

// 40%-lighter palette variant so 12 categories stay distinguishable
// while sourcing every color from the platform chart tokens.
const light = (color: string) => `color-mix(in srgb, ${color} 60%, white)`;

const CATEGORY_COLORS: Record<string, string> = {
	RENT: CHART_PALETTE[0], // sky
	UTILITIES: CHART_PALETTE[2], // amber
	COMMUNICATIONS: CHART_PALETTE[1], // violet
	INSURANCE: CHART_PALETTE[3], // red
	LICENSES: CHART_PALETTE[4], // cyan
	SUBSCRIPTIONS: light(CHART_PALETTE[3]),
	MAINTENANCE: light(CHART_PALETTE[2]),
	BANK_FEES: light(CHART_SEMANTIC.neutral),
	MARKETING: light(CHART_PALETTE[0]),
	TRANSPORT: light(CHART_PALETTE[4]),
	HOSPITALITY: light(CHART_PALETTE[1]),
	OTHER: CHART_SEMANTIC.neutral,
};

export function ExpensesAnalyticsCard({
	expenses,
	formatCurrency,
}: ExpensesAnalyticsCardProps) {
	const t = useTranslations();

	const chartData = Object.entries(expenses.byCategory)
		.filter(([, amount]) => amount > 0)
		.sort(([, a], [, b]) => b - a)
		.map(([category, amount]) => ({
			name: category,
			value: amount,
			color: CATEGORY_COLORS[category] ?? CHART_SEMANTIC.neutral,
		}));

	const isEmpty = chartData.length === 0;

	return (
		<div className="bg-card border-2 rounded-2xl p-5">
			{/* Header */}
			<div className="flex items-center gap-3 mb-5">
				<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
					<Receipt className="h-5 w-5" />
				</div>
				<h3 className="text-sm font-semibold text-card-foreground">
					{t("company.dashboard.expenseAnalytics")}
				</h3>
			</div>

			{isEmpty ? (
				<div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
					{t("company.dashboard.noData")}
				</div>
			) : (
				<>
					{/* Chart */}
					<div className="flex justify-center mb-4" role="img" aria-label={`${t("company.dashboard.expenseAnalytics")} - ${chartData.map(d => `${t(`company.expenses.categories.${d.name}`)}: ${Math.round((d.value / expenses.totalMonthlyAmount) * 100)}%`).join(', ')}`}>
						<ChartContainer
							config={{}}
							className="h-[160px] w-[160px] !aspect-square"
						>
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={40}
									outerRadius={70}
									paddingAngle={2}
									dataKey="value"
									strokeWidth={0}
								>
									{chartData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<text
									x="50%"
									y="46%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-card-foreground text-lg font-bold"
									style={{ fontSize: "14px", fontWeight: 700 }}
								>
									{formatCurrency(Number(expenses.totalMonthlyAmount))}
								</text>
								<text
									x="50%"
									y="60%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-muted-foreground"
									style={{ fontSize: "11px" }}
								>
									{t("company.dashboard.monthlyTotal")}
								</text>
							</PieChart>
						</ChartContainer>
					</div>

					{/* Legend - top categories */}
					<div className="space-y-2 mb-4">
						{chartData.slice(0, 5).map((item) => {
							const pct =
								expenses.totalMonthlyAmount > 0
									? Math.round(
											(item.value / expenses.totalMonthlyAmount) * 100,
										)
									: 0;
							return (
								<div
									key={item.name}
									className="flex items-center justify-between text-sm"
								>
									<div className="flex items-center gap-2">
										<div
											className="w-2.5 h-2.5 rounded-full shrink-0"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-muted-foreground truncate">
											{t(`company.expenses.categories.${item.name}`)}
										</span>
									</div>
									<span className="font-semibold text-card-foreground shrink-0">
										{pct}%
									</span>
								</div>
							);
						})}
					</div>

					{/* Footer */}
					<div className="border-t-2 pt-3 space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								{t("company.dashboard.activeExpenses")}
							</span>
							<span className="font-semibold text-card-foreground">
								{expenses.totalActiveExpenses}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm mt-2">
							<span className="font-bold text-card-foreground">
								{t("company.dashboard.monthlyTotal")}
							</span>
							<span
								className="font-bold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(expenses.totalMonthlyAmount))}
							</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
