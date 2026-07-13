"use client";

import { formatSAR } from "@shared/lib/formatters";
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
			bgColor: "bg-card",
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("projectPayments.totalCollected"),
			value: totalCollected,
			icon: TrendingUp,
			bgColor: "bg-card",
			iconBg: "bg-success/15",
			iconColor: "text-success",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("projectPayments.remaining"),
			value: remaining,
			icon: AlertCircle,
			bgColor: "bg-card",
			iconBg: "bg-destructive/15",
			iconColor: "text-destructive",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("projectPayments.retention"),
			value: retentionAmount,
			icon: Shield,
			bgColor: "bg-card",
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
			{cards.map((card) => (
				<div
					key={card.title}
					className={`flex min-w-0 rounded-xl sm:rounded-2xl border-2 ${card.bgColor} p-2.5 sm:p-4`}
				>
					<div className="flex min-w-0 items-center gap-2 sm:gap-3">
						<div
							className={`shrink-0 rounded-lg sm:rounded-xl ${card.iconBg} p-1.5 sm:p-2.5`}
						>
							<card.icon
								className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${card.iconColor}`}
							/>
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<p className={`truncate text-[11px] sm:text-xs ${card.labelColor}`}>
								{card.title}
							</p>
							<p
								className={`truncate text-sm font-bold tabular-nums sm:text-lg sm:font-semibold ${card.textColor}`}
								title={formatSAR(card.value)}
							>
								{formatSAR(card.value)}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
