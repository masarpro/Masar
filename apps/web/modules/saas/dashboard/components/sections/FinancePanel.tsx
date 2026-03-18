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
		expenses: {
			label: t("dashboard.financial.expensesLabel"),
			color: "#ef4444",
		},
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

	const allZero = chartData.every(
		(d) => (d.claims ?? 0) === 0 && (d.expenses ?? 0) === 0,
	);

	return (
		<div className={`${glassCard} flex flex-col p-3.5 h-full overflow-hidden`}>
			{/* 3 mini-cards */}
			<div className="grid grid-cols-3 gap-2 mb-2.5 shrink-0">
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-0.5">
						<Building2 className="h-3.5 w-3.5 text-primary" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("dashboard.kpi.bankBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-foreground">
						<Currency amount={Number(bankBalance ?? 0)} />
					</p>
				</Link>

				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
				>
					<div className="flex items-center gap-1.5 mb-0.5">
						<Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("dashboard.kpi.cashBalance")}
						</span>
					</div>
					<p className="text-lg font-bold text-foreground">
						<Currency amount={Number(cashBalance ?? 0)} />
					</p>
				</Link>

				<div className="p-2.5 rounded-xl bg-muted/50">
					<div className="flex items-center gap-1.5 mb-0.5">
						<Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("dashboard.alerts.upcomingPayments")}
						</span>
					</div>
					<p className="text-lg font-bold text-foreground">
						{upcomingPayments.length}
					</p>
					{upcomingPayments.length > 0 && (
						<p className="text-xs text-muted-foreground truncate">
							{upcomingPayments[0]?.project?.name}
						</p>
					)}
				</div>
			</div>

			{/* Cash Flow Chart */}
			<div className="flex-1 min-h-0 flex flex-col relative">
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

				<ChartContainer
					config={chartConfig}
					className="flex-1 w-full min-h-[100px] aspect-auto"
				>
					<AreaChart
						data={chartData}
						margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
					>
						<defs>
							<linearGradient
								id="fpIncGrad"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="0%"
									stopColor="#0ea5e9"
									stopOpacity={0.2}
								/>
								<stop
									offset="100%"
									stopColor="#0ea5e9"
									stopOpacity={0}
								/>
							</linearGradient>
							<linearGradient
								id="fpExpGrad"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="0%"
									stopColor="#ef4444"
									stopOpacity={0.1}
								/>
								<stop
									offset="100%"
									stopColor="#ef4444"
									stopOpacity={0}
								/>
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

				{/* Overlay when all zeros */}
				{allZero && (
					<div className="absolute inset-0 top-8 flex items-center justify-center bg-card/60 backdrop-blur-[1px] rounded-xl">
						<div className="text-center">
							<p className="text-sm text-muted-foreground">
								{t("dashboard.financePanel.noTransactions")}
							</p>
							<Link
								href={`/app/${organizationSlug}/finance`}
								className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
							>
								{t("dashboard.financePanel.startRecording")}
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
