"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

interface FinancialOverviewSectionProps {
	totalContractValue: number;
	totalInvoiced: number;
	totalCollected: number;
	profitMargin: number;
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
}

export function FinancialOverviewSection({
	totalContractValue,
	totalInvoiced,
	totalCollected,
	profitMargin,
	financialTrend,
}: FinancialOverviewSectionProps) {
	const t = useTranslations();

	const miniStats = [
		{
			label: t("dashboard.financial.totalContractValue"),
			value: totalContractValue,
			isCurrency: true,
		},
		{
			label: t("dashboard.financial.totalInvoiced"),
			value: totalInvoiced,
			isCurrency: true,
		},
		{
			label: t("dashboard.financial.totalCollected"),
			value: totalCollected,
			isCurrency: true,
		},
		{
			label: t("dashboard.financial.profitMarginLabel"),
			value: `${profitMargin}%`,
			isCurrency: false,
		},
	];

	const chartConfig: ChartConfig = {
		expenses: { label: t("dashboard.financial.expensesLabel"), color: "#ef4444" },
		claims: { label: t("dashboard.financial.revenueLabel"), color: "#10b981" },
	};

	return (
		<div
			className={`${glassCard} flex flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "400ms" }}
		>
			<div className="flex items-center gap-2 mb-4">
				<BarChart3 className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-semibold text-foreground">
					{t("dashboard.financial.title")}
				</span>
			</div>

			{/* Mini stats row */}
			<div className="grid grid-cols-2 gap-3 mb-4">
				{miniStats.map((stat, i) => (
					<div key={i} className="rounded-lg bg-muted/40 p-2.5">
						<p className="text-[10px] text-muted-foreground mb-0.5">
							{stat.label}
						</p>
						<p className="text-sm font-bold text-foreground">
							{stat.isCurrency ? (
								<Currency amount={stat.value as number} />
							) : (
								stat.value
							)}
						</p>
					</div>
				))}
			</div>

			{/* Financial trend chart */}
			{financialTrend.length > 0 ? (
				<ChartContainer config={chartConfig} className="h-[180px] w-full">
					<AreaChart
						data={financialTrend}
						margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
					>
						<defs>
							<linearGradient id="finRevGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
								<stop offset="100%" stopColor="#10b981" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="finExpGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
								<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							fontSize={9}
							tickMargin={6}
						/>
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent />} />
						<Area
							type="monotone"
							dataKey="claims"
							stroke="#10b981"
							fill="url(#finRevGrad)"
							strokeWidth={2}
							dot={false}
						/>
						<Area
							type="monotone"
							dataKey="expenses"
							stroke="#ef4444"
							fill="url(#finExpGrad)"
							strokeWidth={1.5}
							dot={false}
						/>
					</AreaChart>
				</ChartContainer>
			) : (
				<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground py-8">
					<BarChart3 className="h-5 w-5 me-2 text-muted-foreground/50" />
					{t("dashboard.financial.noDataForTrend")}
				</div>
			)}
		</div>
	);
}
