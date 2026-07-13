"use client";

import { formatSAR } from "@shared/lib/formatters";
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
			bgColor: "bg-card",
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("finance.summary.expenses"),
			value: actualExpenses,
			icon: TrendingDown,
			bgColor: "bg-card",
			iconBg: "bg-destructive/15",
			iconColor: "text-destructive",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		...(totalPayments !== undefined
			? [
					{
						title: t("finance.summary.payments"),
						value: totalPayments,
						icon: TrendingUp,
						bgColor: "bg-card",
						iconBg: "bg-success/15",
						iconColor: "text-success",
						textColor: "text-card-foreground",
						labelColor: "text-muted-foreground",
					},
				]
			: []),
		{
			title: t("finance.summary.remaining"),
			value: remaining,
			icon: Wallet,
			bgColor: "bg-card",
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("finance.summary.claimsPaid"),
			value: claimsPaid,
			icon: Receipt,
			bgColor: "bg-card",
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{cards.map((card) => (
				<div
					key={card.title}
					className={`flex min-w-0 flex-1 rounded-xl sm:rounded-2xl border-2 ${card.bgColor} p-2.5 sm:p-5`}
				>
					<div className="flex min-w-0 items-center gap-2 sm:gap-3">
						<div className={`shrink-0 rounded-lg sm:rounded-xl ${card.iconBg} p-1.5 sm:p-2.5`}>
							<card.icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${card.iconColor}`} />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<p className={`truncate text-[11px] sm:text-xs ${card.labelColor}`}>{card.title}</p>
							<p
								className={`truncate text-sm font-bold tabular-nums sm:text-lg sm:font-semibold ${card.textColor}`}
								title={formatSAR(card.value)}
							>
								{formatSAR(card.value)}
							</p>
							{card.title === t("finance.summary.contractValue") &&
								adjustedContractValue !== undefined &&
								adjustedContractValue > 0 &&
								changeOrdersImpact !== 0 && (
									<p className="mt-0.5 truncate text-xs text-chart-4">
										{t("projects.contract.summary.adjustedValue")}:{" "}
										{formatSAR(adjustedContractValue)}
									</p>
								)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
