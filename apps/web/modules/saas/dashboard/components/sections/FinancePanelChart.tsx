"use client";

import { useMemo } from "react";
import { CHART_SEMANTIC } from "@saas/shared/lib/chart-colors";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface FinancePanelChartProps {
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
}

/**
 * The Recharts area chart of the finance panel, split into its own chunk so
 * recharts stays OUT of the org-home initial bundle (same pattern as
 * PricingPipelineChart). Loaded via next/dynamic with ssr:false from
 * FinancePanel — the parent reserves the exact box, so it fades in with zero
 * layout shift.
 */
export default function FinancePanelChart({
	financialTrend,
}: FinancePanelChartProps) {
	const t = useTranslations();
	const locale = useLocale();

	const chartConfig: ChartConfig = {
		claims: {
			label: t("dashboard.financial.revenueLabel"),
			color: CHART_SEMANTIC.primary,
		},
		expenses: {
			label: t("dashboard.financial.expensesLabel"),
			color: CHART_SEMANTIC.negative,
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
			className="w-full flex-1 min-h-[100px] max-h-44 sm:max-h-none aspect-auto"
		>
			<AreaChart
				data={chartData}
				margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
			>
				<defs>
					<linearGradient id="fpIncGrad" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor={CHART_SEMANTIC.primary}
							stopOpacity={0.4}
						/>
						<stop
							offset="100%"
							stopColor={CHART_SEMANTIC.primary}
							stopOpacity={0}
						/>
					</linearGradient>
					<linearGradient id="fpExpGrad" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor={CHART_SEMANTIC.negative}
							stopOpacity={0.15}
						/>
						<stop
							offset="100%"
							stopColor={CHART_SEMANTIC.negative}
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} />
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
				<Area
					type="natural"
					dataKey="claims"
					stroke={CHART_SEMANTIC.primary}
					fill="url(#fpIncGrad)"
					strokeWidth={2}
					dot={false}
				/>
				<Area
					type="natural"
					dataKey="expenses"
					stroke={CHART_SEMANTIC.negative}
					fill="url(#fpExpGrad)"
					strokeWidth={1.5}
					dot={false}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
