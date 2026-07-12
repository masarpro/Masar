"use client";

import { useMemo } from "react";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface FinancePanelChartProps {
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
}

/**
 * Botly Membership bar chart (Figma 69:3172): rounded 12px bars in
 * Brand/01 (yellow) + Brand/02 (coral), no grid, small gray month labels.
 * Split into its own chunk so recharts stays out of the initial bundle.
 */
export default function FinancePanelChart({
	financialTrend,
}: FinancePanelChartProps) {
	const t = useTranslations();
	const locale = useLocale();

	const chartConfig: ChartConfig = {
		claims: {
			label: t("dashboard.financial.revenueLabel"),
			color: "var(--chart-1)",
		},
		expenses: {
			label: t("dashboard.financial.expensesLabel"),
			color: "var(--chart-2)",
		},
	};

	// Convert a "YYYY-MM" key into a localized short month label.
	const formatMonth = useMemo(() => {
		const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
		return (value: string) => {
			const [year, month] = value.split("-").map(Number);
			if (!year || !month) return value;
			return fmt.format(new Date(year, month - 1, 1));
		};
	}, [locale]);

	const chartData = useMemo(() => {
		if (financialTrend && financialTrend.length > 0) {
			return financialTrend;
		}
		const months = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			months.push({
				month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
				claims: 0,
				expenses: 0,
			});
		}
		return months;
	}, [financialTrend]);

	return (
		<ChartContainer
			config={chartConfig}
			className="w-full flex-1 min-h-[140px] max-h-44 sm:max-h-none aspect-auto"
		>
			<BarChart
				data={chartData}
				margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
				barGap={4}
			>
				<XAxis
					dataKey="month"
					tickLine={false}
					axisLine={false}
					fontSize={10}
					tickMargin={6}
					tickFormatter={formatMonth}
				/>
				<YAxis hide />
				<ChartTooltip
					content={
						<ChartTooltipContent
							labelFormatter={(label) => formatMonth(String(label))}
						/>
					}
				/>
				<Bar
					dataKey="claims"
					fill="var(--chart-1)"
					radius={[12, 12, 12, 12]}
					maxBarSize={28}
				/>
				<Bar
					dataKey="expenses"
					fill="var(--chart-2)"
					radius={[12, 12, 12, 12]}
					maxBarSize={28}
				/>
			</BarChart>
		</ChartContainer>
	);
}
