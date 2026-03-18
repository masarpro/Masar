"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { ChevronLeft, DollarSign } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

function getAmountColor(value: number, type: "income" | "expense" | "balance") {
	if (type === "expense") return "text-red-600 dark:text-red-400";
	if (value > 0) return "text-green-600 dark:text-green-400";
	if (value < 0) return "text-red-600 dark:text-red-400";
	return "text-muted-foreground";
}

// Mock data — will be replaced with real data later
const cashFlowData = [
	{ day: "\u0627\u0644\u0633\u0628\u062a", income: 45000, expense: 12000 },
	{ day: "\u0627\u0644\u0623\u062d\u062f", income: 32000, expense: 8000 },
	{ day: "\u0627\u0644\u0627\u062b\u0646\u064a\u0646", income: 0, expense: 15000 },
	{ day: "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621", income: 78000, expense: 22000 },
	{ day: "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", income: 15000, expense: 5000 },
	{ day: "\u0627\u0644\u062e\u0645\u064a\u0633", income: 120000, expense: 35000 },
	{ day: "\u0627\u0644\u062c\u0645\u0639\u0629", income: 0, expense: 0 },
];

interface CashFlowSectionProps {
	organizationSlug: string;
}

export function CashFlowSection({ organizationSlug }: CashFlowSectionProps) {
	const t = useTranslations();

	const cashFlowChartConfig: ChartConfig = {
		income: { label: t("dashboard.cashFlow.income"), color: "#0ea5e9" },
		expense: { label: t("dashboard.cashFlow.expenses"), color: "#ef4444" },
	};

	const totalIncomeChart = cashFlowData.reduce((s, d) => s + d.income, 0);
	const totalExpenseChart = cashFlowData.reduce((s, d) => s + d.expense, 0);
	const netChart = totalIncomeChart - totalExpenseChart;

	return (
		<div
			className={`${glassCard} flex h-full min-h-[240px] flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "450ms" }}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-1.5">
					<DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-[11px] font-semibold text-muted-foreground">
						{t("dashboard.cashFlow.title")}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
				>
					<span>{t("dashboard.cashFlow.goToFinance")}</span>
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Chips */}
			<div className="grid grid-cols-3 gap-2 mb-3">
				<div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
					<span
						className={`text-sm font-bold block ${getAmountColor(totalIncomeChart, "income")}`}
					>
						<Currency amount={totalIncomeChart} />
					</span>
					<span className="text-[9px] text-muted-foreground">
						{t("dashboard.cashFlow.income")}
					</span>
				</div>
				<div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
					<span className="text-sm font-bold text-red-600 dark:text-red-400 block">
						<Currency amount={totalExpenseChart} />
					</span>
					<span className="text-[9px] text-muted-foreground">
						{t("dashboard.cashFlow.expenses")}
					</span>
				</div>
				<div
					className={`text-center p-2 rounded-lg ${netChart >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
				>
					<span
						className={`text-sm font-bold block ${getAmountColor(netChart, "balance")}`}
					>
						<Currency amount={netChart} />
					</span>
					<span className="text-[9px] text-muted-foreground">
						{t("dashboard.cashFlow.net")}
					</span>
				</div>
			</div>

			{/* Chart */}
			<ChartContainer config={cashFlowChartConfig} className="h-40 w-full">
				<AreaChart
					data={cashFlowData}
					margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
				>
					<defs>
						<linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
							<stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="dashExpenseGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
							<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="day"
						tickLine={false}
						axisLine={false}
						fontSize={9}
						tickMargin={6}
					/>
					<YAxis hide />
					<ChartTooltip content={<ChartTooltipContent />} />
					<Area
						type="monotone"
						dataKey="income"
						stroke="#0ea5e9"
						fill="url(#dashIncomeGrad)"
						strokeWidth={2}
						dot={false}
					/>
					<Area
						type="monotone"
						dataKey="expense"
						stroke="#ef4444"
						fill="url(#dashExpenseGrad)"
						strokeWidth={1.5}
						dot={false}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
