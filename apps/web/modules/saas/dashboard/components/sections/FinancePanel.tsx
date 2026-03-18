"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Banknote, Building2, ChevronLeft, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

	const chartConfig: ChartConfig = {
		claims: { label: t("dashboard.financial.revenueLabel"), color: "#0ea5e9" },
		expenses: { label: t("dashboard.financial.expensesLabel"), color: "#ef4444" },
	};

	return (
		<div
			className={`${glassCard} flex flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "120ms" }}
		>
			{/* 3 mini-cards */}
			<div className="grid grid-cols-3 gap-2 mb-3">
				{/* Bank Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-1">
						<Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
						<span className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80">
							{t("dashboard.kpi.bankBalance")}
						</span>
					</div>
					<p className="text-base font-bold text-blue-700 dark:text-blue-300">
						<Currency amount={Number(bankBalance ?? 0)} />
					</p>
				</Link>

				{/* Cash Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-1">
						<Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
						<span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80">
							{t("dashboard.kpi.cashBalance")}
						</span>
					</div>
					<p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
						<Currency amount={Number(cashBalance ?? 0)} />
					</p>
				</Link>

				{/* Upcoming Payments */}
				<div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20">
					<div className="flex items-center gap-1.5 mb-1">
						<Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
						<span className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80">
							{t("dashboard.alerts.upcomingPayments")}
						</span>
					</div>
					<p className="text-base font-bold text-amber-700 dark:text-amber-300">
						{upcomingPayments.length}
					</p>
					{upcomingPayments.length > 0 && (
						<p className="text-[9px] text-amber-600/60 dark:text-amber-400/60 mt-0.5 truncate">
							{upcomingPayments[0]?.project?.name}
						</p>
					)}
				</div>
			</div>

			{/* Cash Flow Chart (monthly — real data) */}
			<div className="flex-1 min-h-0">
				<div className="flex items-center justify-between mb-2">
					<span className="text-[11px] font-semibold text-muted-foreground">
						{t("dashboard.financePanel.cashFlowTitle")}
					</span>
					<Link
						href={`/app/${organizationSlug}/finance`}
						className="flex items-center gap-1 text-[10px] text-primary hover:underline"
					>
						<span>{t("dashboard.cashFlow.goToFinance")}</span>
						<ChevronLeft className="h-3 w-3" />
					</Link>
				</div>

				{financialTrend.length > 0 ? (
					<ChartContainer config={chartConfig} className="h-[160px] w-full">
						<AreaChart
							data={financialTrend}
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
								fontSize={9}
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
				) : (
					<div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
						{t("dashboard.financial.noDataForTrend")}
					</div>
				)}
			</div>
		</div>
	);
}
