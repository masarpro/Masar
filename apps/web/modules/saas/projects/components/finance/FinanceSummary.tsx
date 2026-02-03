"use client";

import { Banknote, Receipt, TrendingDown, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface FinanceSummaryProps {
	contractValue: number;
	actualExpenses: number;
	remaining: number;
	claimsPaid: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function FinanceSummary({
	contractValue,
	actualExpenses,
	remaining,
	claimsPaid,
}: FinanceSummaryProps) {
	const t = useTranslations();

	const cards = [
		{
			title: t("finance.summary.contractValue"),
			value: contractValue,
			icon: Banknote,
			bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
			iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			textColor: "text-indigo-700 dark:text-indigo-300",
			labelColor: "text-indigo-600 dark:text-indigo-400",
		},
		{
			title: t("finance.summary.expenses"),
			value: actualExpenses,
			icon: TrendingDown,
			bgColor: "bg-red-50 dark:bg-red-950/30",
			iconBg: "bg-red-100 dark:bg-red-900/50",
			iconColor: "text-red-600 dark:text-red-400",
			textColor: "text-red-700 dark:text-red-300",
			labelColor: "text-red-600 dark:text-red-400",
		},
		{
			title: t("finance.summary.remaining"),
			value: remaining,
			icon: Wallet,
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
			iconBg: "bg-teal-100 dark:bg-teal-900/50",
			iconColor: "text-teal-600 dark:text-teal-400",
			textColor: "text-teal-700 dark:text-teal-300",
			labelColor: "text-teal-600 dark:text-teal-400",
		},
		{
			title: t("finance.summary.claimsPaid"),
			value: claimsPaid,
			icon: Receipt,
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			textColor: "text-amber-700 dark:text-amber-300",
			labelColor: "text-amber-600 dark:text-amber-400",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			{cards.map((card) => (
				<div key={card.title} className={`rounded-2xl ${card.bgColor} p-5`}>
					<div className="flex items-center gap-3">
						<div className={`rounded-xl ${card.iconBg} p-2.5`}>
							<card.icon className={`h-5 w-5 ${card.iconColor}`} />
						</div>
						<div className="min-w-0 flex-1">
							<p className={`text-xs ${card.labelColor}`}>{card.title}</p>
							<p
								className={`truncate text-lg font-semibold ${card.textColor}`}
								title={formatCurrency(card.value)}
							>
								{formatCurrency(card.value)}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
