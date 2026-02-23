"use client";

import { Banknote, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface FinanceSummaryProps {
	contractValue: number;
	actualExpenses: number;
	totalPayments?: number;
	remaining: number;
	claimsPaid: number;
	adjustedContractValue?: number;
	changeOrdersImpact?: number;
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
	totalPayments,
	remaining,
	claimsPaid,
	adjustedContractValue,
	changeOrdersImpact,
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
		...(totalPayments !== undefined
			? [
					{
						title: t("finance.summary.payments"),
						value: totalPayments,
						icon: TrendingUp,
						bgColor: "bg-green-50 dark:bg-green-950/30",
						iconBg: "bg-green-100 dark:bg-green-900/50",
						iconColor: "text-green-600 dark:text-green-400",
						textColor: "text-green-700 dark:text-green-300",
						labelColor: "text-green-600 dark:text-green-400",
					},
				]
			: []),
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
		<div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{cards.map((card) => (
				<div
					key={card.title}
					className={`flex min-w-0 flex-1 rounded-2xl border border-slate-200/60 shadow-lg shadow-black/5 ${card.bgColor} p-4 dark:border-slate-700/50 sm:p-5`}
				>
					<div className="flex min-w-0 items-center gap-3">
						<div className={`shrink-0 rounded-xl ${card.iconBg} p-2.5`}>
							<card.icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<p className={`truncate text-xs ${card.labelColor}`}>{card.title}</p>
							<p
								className={`truncate text-base font-semibold sm:text-lg ${card.textColor}`}
								title={formatCurrency(card.value)}
							>
								{formatCurrency(card.value)}
							</p>
							{card.title === t("finance.summary.contractValue") &&
								adjustedContractValue !== undefined &&
								adjustedContractValue > 0 &&
								changeOrdersImpact !== 0 && (
									<p className="mt-0.5 truncate text-xs text-teal-600 dark:text-teal-400">
										{t("projects.contract.summary.adjustedValue")}:{" "}
										{formatCurrency(adjustedContractValue)}
									</p>
								)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
