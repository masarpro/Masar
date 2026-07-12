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

const compactTick = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 0,
});

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
			className="w-full flex-1 min-h-[96px] aspect-auto"
		>
			<BarChart
				data={chartData}
				margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
				barGap={3}
			>
				<XAxis
					dataKey="month"
					tickLine={false}
					axisLine={false}
					fontSize={10}
					tickMargin={6}
					tickFormatter={formatMonth}
				/>
				{/* Botly Membership: axis figures beside the bars (1000/500/0) */}
				<YAxis
					orientation="right"
					tickLine={false}
					axisLine={false}
					fontSize={10}
					width={38}
					tickCount={3}
					tickFormatter={(v: number) => compactTick.format(v)}
				/>
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
					radius={[10, 10, 10, 10]}
					maxBarSize={22}
				/>
				<Bar
					dataKey="expenses"
					fill="var(--chart-2)"
					radius={[10, 10, 10, 10]}
					maxBarSize={22}
				/>
			</BarChart>
		</ChartContainer>
	);
}
