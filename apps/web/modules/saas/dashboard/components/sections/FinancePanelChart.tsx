"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { CHART_SEMANTIC } from "@saas/shared/lib/chart-colors";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
} from "@ui/components/chart";
import { BarChart3 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface FinancePanelChartProps {
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
}

/**
 * Tooltip مخصص للتدفق النقدي: الشهر + المقبوضات + المصروفات + صافي التدفق،
 * بنفس ألوان السلاسل — لا اعتماد على اللون وحده (كل قيمة باسمها الواضح).
 */
function CashFlowTooltip({
	active,
	payload,
	label,
	formatMonth,
	labels,
}: {
	active?: boolean;
	payload?: Array<{ dataKey?: string | number; value?: number | string }>;
	label?: string | number;
	formatMonth: (value: string) => string;
	labels: { income: string; expenses: string; net: string };
}) {
	if (!active || !payload || payload.length === 0) return null;

	const claims = Number(
		payload.find((p) => p.dataKey === "claims")?.value ?? 0,
	);
	const expenses = Number(
		payload.find((p) => p.dataKey === "expenses")?.value ?? 0,
	);
	const net = claims - expenses;

	return (
		<div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl min-w-[10rem]">
			<p className="font-bold text-foreground mb-1.5">
				{formatMonth(String(label ?? ""))}
			</p>
			<div className="space-y-1">
				<div className="flex items-center justify-between gap-4">
					<span className="flex items-center gap-1.5 text-foreground/80">
						<span
							className="h-2 w-2 rounded-[2px]"
							style={{ backgroundColor: CHART_SEMANTIC.positive }}
						/>
						{labels.income}
					</span>
					<span className="font-medium tabular-nums text-foreground">
						<Currency amount={claims} />
					</span>
				</div>
				<div className="flex items-center justify-between gap-4">
					<span className="flex items-center gap-1.5 text-foreground/80">
						<span
							className="h-2 w-2 rounded-[2px]"
							style={{ backgroundColor: CHART_SEMANTIC.negative }}
						/>
						{labels.expenses}
					</span>
					<span className="font-medium tabular-nums text-foreground">
						<Currency amount={expenses} />
					</span>
				</div>
				<div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1 mt-1">
					<span className="font-medium text-foreground">
						{labels.net}
					</span>
					<span
						className={`font-bold tabular-nums ${net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
					>
						<Currency amount={net} />
					</span>
				</div>
			</div>
		</div>
	);
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

	// المقبوضات بلون النجاح (يطابق بطاقة المقبوضات الزمردية) والمصروفات
	// بلون الخطر (يطابق بطاقة المصروفات الوردية) — من لوحة الألوان المعتمدة.
	const chartConfig: ChartConfig = {
		claims: {
			label: t("dashboard.cashFlow.income"),
			color: CHART_SEMANTIC.positive,
		},
		expenses: {
			label: t("dashboard.cashFlow.expenses"),
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

	const hasData = useMemo(
		() =>
			(financialTrend ?? []).some(
				(m) => (m.claims ?? 0) > 0 || (m.expenses ?? 0) > 0,
			),
		[financialTrend],
	);

	// حالة فارغة واضحة — نفس أبعاد صندوق المخطط لمنع أي Layout Shift
	if (!hasData) {
		return (
			<div className="w-full flex-1 min-h-[100px] max-h-44 sm:max-h-none flex flex-col items-center justify-center gap-1.5 rounded-lg bg-muted/20 text-center p-3">
				<BarChart3 className="h-6 w-6 text-muted-foreground/50" />
				<p className="text-xs text-foreground/70">
					{t("dashboard.cashFlow.empty")}
				</p>
			</div>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="w-full flex-1 min-h-[100px] max-h-44 sm:max-h-none aspect-auto"
		>
			<AreaChart
				data={financialTrend}
				margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
			>
				<defs>
					<linearGradient id="fpIncGrad" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor={CHART_SEMANTIC.positive}
							stopOpacity={0.4}
						/>
						<stop
							offset="100%"
							stopColor={CHART_SEMANTIC.positive}
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
					fontSize={11}
					tickMargin={6}
					tickFormatter={formatMonth}
				/>
				<YAxis hide />
				<ChartTooltip
					content={
						<CashFlowTooltip
							formatMonth={formatMonth}
							labels={{
								income: t("dashboard.cashFlow.income"),
								expenses: t("dashboard.cashFlow.expenses"),
								net: t("dashboard.cashFlow.net"),
							}}
						/>
					}
				/>
				<Area
					type="natural"
					dataKey="claims"
					name={t("dashboard.cashFlow.income")}
					stroke={CHART_SEMANTIC.positive}
					fill="url(#fpIncGrad)"
					strokeWidth={2}
					dot={false}
				/>
				<Area
					type="natural"
					dataKey="expenses"
					name={t("dashboard.cashFlow.expenses")}
					stroke={CHART_SEMANTIC.negative}
					fill="url(#fpExpGrad)"
					strokeWidth={1.5}
					dot={false}
				/>
				<ChartLegend content={<ChartLegendContent />} />
			</AreaChart>
		</ChartContainer>
	);
}
