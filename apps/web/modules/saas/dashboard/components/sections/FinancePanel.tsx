"use client";

import { useMemo } from "react";
import { Currency } from "@saas/finance/components/shared/Currency";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Banknote, Building2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

interface FinancePanelProps {
	bankBalance: number;
	cashBalance: number;
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
	organizationSlug: string;
}

export function FinancePanel({
	bankBalance,
	cashBalance,
	financialTrend,
	organizationSlug,
}: FinancePanelProps) {
	const t = useTranslations();
	const locale = useLocale();

	const chartConfig: ChartConfig = {
		claims: { label: t("dashboard.financial.revenueLabel"), color: "#0ea5e9" },
		expenses: { label: t("dashboard.financial.expensesLabel"), color: "#ef4444" },
	};

	const chartData = useMemo(() => {
		if (financialTrend && financialTrend.length > 0) {
			return financialTrend;
		}
		const months = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			months.push({
				month: new Intl.DateTimeFormat(locale, { month: "short" }).format(d),
				claims: 0,
				expenses: 0,
			});
		}
		return months;
	}, [financialTrend, locale]);

	return (
		<div className={`${glassCard} flex flex-col p-3 overflow-hidden`}>
			{/* 2 balance cards */}
			<div className="grid grid-cols-2 gap-3 mb-2 shrink-0">
				{/* Bank Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm p-3 hover:shadow-md transition-all"
				>
					<div className="flex items-center gap-2 mb-1.5">
						<div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("dashboard.kpi.bankBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
						<Currency amount={Number(bankBalance ?? 0)} />
					</p>
				</Link>

				{/* Cash Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm p-3 hover:shadow-md transition-all"
				>
					<div className="flex items-center gap-2 mb-1.5">
						<div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						</div>
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("dashboard.kpi.cashBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
						<Currency amount={Number(cashBalance ?? 0)} />
					</p>
				</Link>
			</div>

			{/* Cash Flow Chart — matches finance page style */}
			<div className="flex-1 flex flex-col min-h-0">
				<div className="flex items-center justify-between mb-1.5 shrink-0">
					<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
						{t("dashboard.financePanel.cashFlowTitle")}
					</span>
					<Link
						href={`/app/${organizationSlug}/finance`}
						className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
					>
						<span>{t("dashboard.cashFlow.goToFinance")}</span>
						<ChevronLeft className="h-3 w-3" />
					</Link>
				</div>

				<ChartContainer config={chartConfig} className="w-full flex-1 min-h-[80px] aspect-auto">
					<AreaChart
						data={chartData}
						margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fpIncGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
								<stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="fpExpGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
								<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							tickMargin={6}
						/>
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent />} />
						<Area
							type="natural"
							dataKey="claims"
							stroke="#0ea5e9"
							fill="url(#fpIncGrad)"
							strokeWidth={2}
							dot={false}
						/>
						<Area
							type="natural"
							dataKey="expenses"
							stroke="#ef4444"
							fill="url(#fpExpGrad)"
							strokeWidth={1.5}
							dot={false}
						/>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
