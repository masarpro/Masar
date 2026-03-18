"use client";

import { useMemo } from "react";
import { Currency } from "@saas/finance/components/shared/Currency";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Banknote, Building2, ChevronLeft, Clock } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

interface Milestone {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	status: string;
	progress: number | { toString(): string };
	project: { id: string; name: string };
}

interface FinancePanelProps {
	bankBalance: number;
	cashBalance: number;
	upcomingPayments: Milestone[];
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
	organizationSlug: string;
}

export function FinancePanel({
	bankBalance,
	cashBalance,
	upcomingPayments,
	financialTrend,
	organizationSlug,
}: FinancePanelProps) {
	const t = useTranslations();
	const locale = useLocale();

	const chartConfig: ChartConfig = {
		claims: { label: t("dashboard.financial.revenueLabel"), color: "#0ea5e9" },
		expenses: { label: t("dashboard.financial.expensesLabel"), color: "#ef4444" },
	};

	// Always show chart — use zeros for last 6 months if no data
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
		<div className={`${glassCard} flex flex-col p-3.5 overflow-hidden`}>
			{/* 3 mini-cards */}
			<div className="grid grid-cols-3 gap-2 mb-2.5 shrink-0">
				{/* Bank Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-0.5">
						<Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
						<span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
							{t("dashboard.kpi.bankBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-blue-700 dark:text-blue-300">
						<Currency amount={Number(bankBalance ?? 0)} />
					</p>
				</Link>

				{/* Cash Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-0.5">
						<Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
						<span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
							{t("dashboard.kpi.cashBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
						<Currency amount={Number(cashBalance ?? 0)} />
					</p>
				</Link>

				{/* Upcoming Payments */}
				<div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20">
					<div className="flex items-center gap-1.5 mb-0.5">
						<Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
						<span className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80">
							{t("dashboard.alerts.upcomingPayments")}
						</span>
					</div>
					<p className="text-lg font-bold text-amber-700 dark:text-amber-300">
						{upcomingPayments.length}
					</p>
					{upcomingPayments.length > 0 && (
						<p className="text-[11px] text-amber-600/60 dark:text-amber-400/60 truncate">
							{upcomingPayments[0]?.project?.name}
						</p>
					)}
				</div>
			</div>

			{/* Cash Flow Chart — always visible */}
			<div className="flex flex-col">
				<div className="flex items-center justify-between mb-1.5 shrink-0">
					<span className="text-sm font-semibold text-muted-foreground">
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

				<ChartContainer config={chartConfig} className="w-full h-[130px] aspect-auto">
					<AreaChart
						data={chartData}
						margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fpIncGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
								<stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="fpExpGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
								<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							fontSize={11}
							tickMargin={6}
						/>
						<YAxis hide />
						<ChartTooltip content={<ChartTooltipContent />} />
						<Area
							type="monotone"
							dataKey="claims"
							stroke="#0ea5e9"
							fill="url(#fpIncGrad)"
							strokeWidth={2}
							dot={false}
						/>
						<Area
							type="monotone"
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
