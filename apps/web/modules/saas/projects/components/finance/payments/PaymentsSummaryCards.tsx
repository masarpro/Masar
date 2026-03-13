"use client";

import { useTranslations } from "next-intl";
import {
	Banknote,
	TrendingUp,
	AlertCircle,
	Shield,
} from "lucide-react";

interface PaymentsSummaryCardsProps {
	contractValue: number;
	totalCollected: number;
	remaining: number;
	retentionAmount: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function PaymentsSummaryCards({
	contractValue,
	totalCollected,
	remaining,
	retentionAmount,
}: PaymentsSummaryCardsProps) {
	const t = useTranslations();

	const cards = [
		{
			title: t("projectPayments.contractValue"),
			value: contractValue,
			icon: Banknote,
			bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
			iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			textColor: "text-indigo-700 dark:text-indigo-300",
			labelColor: "text-indigo-600/80 dark:text-indigo-400/80",
		},
		{
			title: t("projectPayments.totalCollected"),
			value: totalCollected,
			icon: TrendingUp,
			bgColor: "bg-sky-50 dark:bg-sky-950/30",
			iconBg: "bg-sky-100 dark:bg-sky-900/50",
			iconColor: "text-sky-600 dark:text-sky-400",
			textColor: "text-sky-700 dark:text-sky-300",
			labelColor: "text-sky-600/80 dark:text-sky-400/80",
		},
		{
			title: t("projectPayments.remaining"),
			value: remaining,
			icon: AlertCircle,
			bgColor: "bg-red-50 dark:bg-red-950/30",
			iconBg: "bg-red-100 dark:bg-red-900/50",
			iconColor: "text-red-600 dark:text-red-400",
			textColor: "text-red-700 dark:text-red-300",
			labelColor: "text-red-600/80 dark:text-red-400/80",
		},
		{
			title: t("projectPayments.retention"),
			value: retentionAmount,
			icon: Shield,
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			textColor: "text-amber-700 dark:text-amber-300",
			labelColor: "text-amber-600/80 dark:text-amber-400/80",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{cards.map((card) => (
				<div
					key={card.title}
					className={`flex min-w-0 rounded-2xl border border-slate-200/60 shadow-lg shadow-black/5 ${card.bgColor} p-4 dark:border-slate-700/50`}
				>
					<div className="flex min-w-0 items-center gap-3">
						<div
							className={`shrink-0 rounded-xl ${card.iconBg} p-2.5`}
						>
							<card.icon
								className={`h-5 w-5 shrink-0 ${card.iconColor}`}
							/>
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<p className={`truncate text-xs ${card.labelColor}`}>
								{card.title}
							</p>
							<p
								className={`truncate text-base font-semibold sm:text-lg ${card.textColor}`}
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
