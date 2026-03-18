"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	ArrowDownRight,
	ArrowUpLeft,
	Clock,
	Landmark,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

function getAmountColor(value: number, type: "income" | "expense" | "balance") {
	if (type === "expense") return "text-red-600 dark:text-red-400";
	if (value > 0) return "text-green-600 dark:text-green-400";
	if (value < 0) return "text-red-600 dark:text-red-400";
	return "text-muted-foreground";
}

interface KpiCardsRowProps {
	bankBalance: number;
	cashBalance: number;
	totalIncome: number;
	totalExpenses: number;
	totalOutstanding: number;
	netProfit: number;
	profitMargin: number;
	organizationSlug: string;
}

export function KpiCardsRow({
	bankBalance,
	cashBalance,
	totalIncome,
	totalExpenses,
	totalOutstanding,
	netProfit,
	profitMargin,
	organizationSlug,
}: KpiCardsRowProps) {
	const t = useTranslations();

	const kpis = [
		{
			label: t("dashboard.kpi.bankBalance"),
			value: bankBalance,
			icon: Landmark,
			iconColor: "text-sky-600 dark:text-sky-400",
			bgColor: "bg-sky-100 dark:bg-sky-900/30",
			valueColor: getAmountColor(bankBalance, "balance"),
			sub: t("dashboard.kpi.vsLastMonth"),
		},
		{
			label: t("dashboard.kpi.cashBalance"),
			value: cashBalance,
			icon: Wallet,
			iconColor: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-100 dark:bg-blue-900/30",
			valueColor: getAmountColor(cashBalance, "balance"),
			sub: t("dashboard.kpi.vsLastMonth"),
		},
		{
			label: t("dashboard.kpi.totalIncome"),
			value: totalIncome,
			icon: ArrowDownRight,
			iconColor: "text-sky-600 dark:text-sky-400",
			bgColor: "bg-sky-100 dark:bg-sky-900/30",
			valueColor: getAmountColor(totalIncome, "income"),
			sub: t("dashboard.kpi.thisMonth"),
		},
		{
			label: t("dashboard.kpi.totalExpenses"),
			value: totalExpenses,
			icon: ArrowUpLeft,
			iconColor: "text-red-600 dark:text-red-400",
			bgColor: "bg-red-100 dark:bg-red-900/30",
			valueColor: getAmountColor(totalExpenses, "expense"),
			sub: t("dashboard.kpi.thisMonth"),
		},
		{
			label: t("dashboard.kpi.outstanding"),
			value: totalOutstanding,
			icon: Clock,
			iconColor: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-100 dark:bg-amber-900/30",
			valueColor: "text-amber-600 dark:text-amber-400",
			sub: t("dashboard.kpi.outstandingSubtitle"),
			href: `/app/${organizationSlug}/finance/invoices?status=SENT`,
		},
		{
			label: t("dashboard.kpi.netProfitLabel"),
			value: netProfit,
			icon: netProfit >= 0 ? TrendingUp : TrendingDown,
			iconColor: netProfit >= 0
				? "text-emerald-600 dark:text-emerald-400"
				: "text-red-600 dark:text-red-400",
			bgColor: netProfit >= 0
				? "bg-emerald-100 dark:bg-emerald-900/30"
				: "bg-red-100 dark:bg-red-900/30",
			valueColor: netProfit >= 0
				? "text-emerald-600 dark:text-emerald-400"
				: "text-red-600 dark:text-red-400",
			sub: `${profitMargin}% ${t("dashboard.kpi.profitMarginLabel")}`,
		},
	];

	const cardClass = `${glassCard} masar-glow p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500`;

	const renderCard = (kpi: (typeof kpis)[number], i: number) => {
		const Icon = kpi.icon;
		const inner = (
			<>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-medium text-muted-foreground">
						{kpi.label}
					</span>
					<div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
						<Icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
					</div>
				</div>
				<p className={`text-lg font-bold ${kpi.valueColor}`}>
					<Currency amount={kpi.value} />
				</p>
				<p className="text-[10px] text-muted-foreground/70 mt-1">
					{kpi.sub}
				</p>
			</>
		);

		if (kpi.href) {
			return (
				<Link
					key={i}
					href={kpi.href}
					className={cardClass}
					style={{ animationDelay: `${i * 60}ms` }}
				>
					{inner}
				</Link>
			);
		}

		return (
			<div
				key={i}
				className={cardClass}
				style={{ animationDelay: `${i * 60}ms` }}
			>
				{inner}
			</div>
		);
	};

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
			{kpis.map((kpi, i) => renderCard(kpi, i))}
		</div>
	);
}
