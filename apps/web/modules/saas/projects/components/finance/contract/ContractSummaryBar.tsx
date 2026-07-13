"use client";

import { formatSAR } from "@shared/lib/formatters";
import { Banknote, FileDiff, TrendingUp, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContractSummaryBarProps {
	originalValue: number;
	approvedCOImpact: number;
	adjustedValue: number;
	retentionAmount: number;
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
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("projects.contract.summary.changeOrders"),
			value: approvedCOImpact,
			icon: FileDiff,
			iconBg:
				approvedCOImpact >= 0
					? "bg-success/15"
					: "bg-destructive/15",
			iconColor:
				approvedCOImpact >= 0
					? "text-success"
					: "text-destructive",
			textColor:
				approvedCOImpact >= 0
					? "text-success"
					: "text-destructive",
			labelColor: "text-muted-foreground",
			prefix: approvedCOImpact > 0 ? "+" : "",
		},
		{
			title: t("projects.contract.summary.adjustedValue"),
			value: adjustedValue,
			icon: TrendingUp,
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("projects.contract.summary.retentionHeld"),
			value: retentionAmount,
			icon: Shield,
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
	];

	return (
		<div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
			{cards.map((card) => (
				<div key={card.title} className="rounded-2xl border-2 bg-card p-5">
					<div className="flex items-center gap-3">
						<div className={`rounded-xl ${card.iconBg} p-2.5`}>
							<card.icon className={`h-5 w-5 ${card.iconColor}`} />
						</div>
						<div className="min-w-0 flex-1">
							<p className={`text-xs ${card.labelColor}`}>{card.title}</p>
							<p
								className={`truncate text-lg font-semibold ${card.textColor}`}
								title={formatSAR(card.value)}
							>
								{"prefix" in card && card.prefix}
								{formatSAR(card.value)}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
