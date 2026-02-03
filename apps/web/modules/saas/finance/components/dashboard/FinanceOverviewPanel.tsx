"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import {
	Wallet,
	Landmark,
	TrendingUp,
	TrendingDown,
	FileText,
	Receipt,
	Clock,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatCurrency } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface FinanceStats {
	quotations: {
		total: number;
		totalValue: number;
	};
	invoices: {
		total: number;
		totalValue: number;
		outstandingValue: number;
		overdue: number;
	};
	clients: {
		total: number;
	};
}

interface FinanceOverviewPanelProps {
	stats?: FinanceStats;
}

// Mock data for sparkline chart
// TODO: Connect to real cash flow API
const mockCashFlowData = [
	{ day: "السبت", amount: 45000 },
	{ day: "الأحد", amount: 52000 },
	{ day: "الإثنين", amount: 48000 },
	{ day: "الثلاثاء", amount: 61000 },
	{ day: "الأربعاء", amount: 55000 },
	{ day: "الخميس", amount: 67000 },
	{ day: "الجمعة", amount: 72000 },
];

const chartConfig: ChartConfig = {
	amount: {
		label: "التدفق النقدي",
		color: "hsl(var(--primary))",
	},
};

// Mock balance data
// TODO: Connect to real API
const mockBalances = {
	cashBalance: 123456,
	bankBalance: 456789,
	netProfit: 89012,
	cashTrend: { value: 12, isPositive: true },
	bankTrend: { value: 8, isPositive: true },
	profitTrend: { value: 3, isPositive: false },
};

export function FinanceOverviewPanel({ stats }: FinanceOverviewPanelProps) {
	const t = useTranslations();

	return (
		<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6 space-y-6">
			{/* Row 1 - Main Balances */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Cash Balance */}
				<div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						{mockBalances.cashTrend && (
							<div
								className={`flex items-center gap-0.5 text-xs ${
									mockBalances.cashTrend.isPositive
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{mockBalances.cashTrend.isPositive ? (
									<TrendingUp className="h-3 w-3" />
								) : (
									<TrendingDown className="h-3 w-3" />
								)}
								<span>
									{mockBalances.cashTrend.isPositive ? "+" : ""}
									{mockBalances.cashTrend.value}%
								</span>
							</div>
						)}
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("finance.dashboard.overview.cashBalance")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						<Currency amount={mockBalances.cashBalance} />
					</p>
				</div>

				{/* Bank Balance */}
				<div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						{mockBalances.bankTrend && (
							<div
								className={`flex items-center gap-0.5 text-xs ${
									mockBalances.bankTrend.isPositive
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{mockBalances.bankTrend.isPositive ? (
									<TrendingUp className="h-3 w-3" />
								) : (
									<TrendingDown className="h-3 w-3" />
								)}
								<span>
									{mockBalances.bankTrend.isPositive ? "+" : ""}
									{mockBalances.bankTrend.value}%
								</span>
							</div>
						)}
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("finance.dashboard.overview.bankBalance")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						<Currency amount={mockBalances.bankBalance} />
					</p>
				</div>

				{/* Net Profit */}
				<div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
							<TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						{mockBalances.profitTrend && (
							<div
								className={`flex items-center gap-0.5 text-xs ${
									mockBalances.profitTrend.isPositive
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{mockBalances.profitTrend.isPositive ? (
									<TrendingUp className="h-3 w-3" />
								) : (
									<TrendingDown className="h-3 w-3" />
								)}
								<span>
									{mockBalances.profitTrend.isPositive ? "+" : ""}
									{mockBalances.profitTrend.value}%
								</span>
							</div>
						)}
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("finance.dashboard.overview.netProfit")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						<Currency amount={mockBalances.netProfit} />
					</p>
				</div>
			</div>

			{/* Row 2 - Small Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{/* Quotations */}
				<div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/30 p-4 border border-blue-100/50 dark:border-blue-900/50">
					<div className="flex items-center gap-2 mb-2">
						<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						<span className="text-xs font-medium text-blue-600 dark:text-blue-400">
							{t("finance.stats.quotations")}
						</span>
					</div>
					<p className="text-xl font-bold text-blue-700 dark:text-blue-300">
						{stats?.quotations.total ?? 0}
					</p>
					<p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
						<Currency amount={stats?.quotations.totalValue ?? 0} />
					</p>
				</div>

				{/* Invoices */}
				<div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 p-4 border border-emerald-100/50 dark:border-emerald-900/50">
					<div className="flex items-center gap-2 mb-2">
						<Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
							{t("finance.stats.invoices")}
						</span>
					</div>
					<p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
						{stats?.invoices.total ?? 0}
					</p>
					<p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
						<Currency amount={stats?.invoices.totalValue ?? 0} />
					</p>
				</div>

				{/* Outstanding */}
				<div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 p-4 border border-amber-100/50 dark:border-amber-900/50">
					<div className="flex items-center gap-2 mb-2">
						<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
						<span className="text-xs font-medium text-amber-600 dark:text-amber-400">
							{t("finance.stats.outstanding")}
						</span>
					</div>
					<p className="text-xl font-bold text-amber-700 dark:text-amber-300">
						<Currency amount={stats?.invoices.outstandingValue ?? 0} />
					</p>
					<p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
						{stats?.invoices.overdue ?? 0} {t("finance.stats.overdue")}
					</p>
				</div>

				{/* Clients */}
				<div className="rounded-xl bg-teal-50/80 dark:bg-teal-950/30 p-4 border border-teal-100/50 dark:border-teal-900/50">
					<div className="flex items-center gap-2 mb-2">
						<Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
						<span className="text-xs font-medium text-teal-600 dark:text-teal-400">
							{t("finance.stats.clients")}
						</span>
					</div>
					<p className="text-xl font-bold text-teal-700 dark:text-teal-300">
						{stats?.clients.total ?? 0}
					</p>
					<p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-1">
						{t("finance.stats.activeClients")}
					</p>
				</div>
			</div>

			{/* Row 3 - Sparkline Chart */}
			<div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
						{t("finance.dashboard.overview.cashFlow")}
					</h3>
					<span className="text-xs text-slate-500 dark:text-slate-400">
						{t("finance.dashboard.overview.last7Days")}
					</span>
				</div>
				<ChartContainer config={chartConfig} className="h-32 w-full">
					<AreaChart
						accessibilityLayer
						data={mockCashFlowData}
						margin={{ top: 0, right: 5, left: 5, bottom: 20 }}
					>
						<defs>
							<linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="hsl(var(--primary))"
									stopOpacity={0.4}
								/>
								<stop
									offset="100%"
									stopColor="hsl(var(--primary))"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							fontSize={10}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value: number | string) => formatCurrency(Number(value))}
								/>
							}
						/>
						<Area
							dataKey="amount"
							type="natural"
							fill="url(#cashFlowGradient)"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
