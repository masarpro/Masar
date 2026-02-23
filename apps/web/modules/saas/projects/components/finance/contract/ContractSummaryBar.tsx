"use client";

import { Banknote, FileDiff, TrendingUp, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContractSummaryBarProps {
	originalValue: number;
	approvedCOImpact: number;
	adjustedValue: number;
	retentionAmount: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function ContractSummaryBar({
	originalValue,
	approvedCOImpact,
	adjustedValue,
	retentionAmount,
}: ContractSummaryBarProps) {
	const t = useTranslations();

	const cards = [
		{
			title: t("projects.contract.summary.originalValue"),
			value: originalValue,
			icon: Banknote,
			bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
			iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			textColor: "text-indigo-700 dark:text-indigo-300",
			labelColor: "text-indigo-600 dark:text-indigo-400",
		},
		{
			title: t("projects.contract.summary.changeOrders"),
			value: approvedCOImpact,
			icon: FileDiff,
			bgColor:
				approvedCOImpact >= 0
					? "bg-green-50 dark:bg-green-950/30"
					: "bg-red-50 dark:bg-red-950/30",
			iconBg:
				approvedCOImpact >= 0
					? "bg-green-100 dark:bg-green-900/50"
					: "bg-red-100 dark:bg-red-900/50",
			iconColor:
				approvedCOImpact >= 0
					? "text-green-600 dark:text-green-400"
					: "text-red-600 dark:text-red-400",
			textColor:
				approvedCOImpact >= 0
					? "text-green-700 dark:text-green-300"
					: "text-red-700 dark:text-red-300",
			labelColor:
				approvedCOImpact >= 0
					? "text-green-600 dark:text-green-400"
					: "text-red-600 dark:text-red-400",
			prefix: approvedCOImpact > 0 ? "+" : "",
		},
		{
			title: t("projects.contract.summary.adjustedValue"),
			value: adjustedValue,
			icon: TrendingUp,
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
			iconBg: "bg-teal-100 dark:bg-teal-900/50",
			iconColor: "text-teal-600 dark:text-teal-400",
			textColor: "text-teal-700 dark:text-teal-300",
			labelColor: "text-teal-600 dark:text-teal-400",
		},
		{
			title: t("projects.contract.summary.retentionHeld"),
			value: retentionAmount,
			icon: Shield,
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			textColor: "text-amber-700 dark:text-amber-300",
			labelColor: "text-amber-600 dark:text-amber-400",
		},
	];

	return (
		<div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
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
								{"prefix" in card && card.prefix}
								{formatCurrency(card.value)}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
