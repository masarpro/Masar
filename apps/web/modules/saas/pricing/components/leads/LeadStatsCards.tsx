"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import { Banknote, CheckCircle, Clock, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeadStatsCardsProps {
	organizationId: string;
}

function formatCurrency(amount: number): string {
	return (
		new Intl.NumberFormat("en-SA", {
			style: "decimal",
			maximumFractionDigits: 0,
		}).format(amount) + " ر.س"
	);
}

export function LeadStatsCards({ organizationId }: LeadStatsCardsProps) {
	const t = useTranslations();

	const { data: stats } = useQuery(
		orpc.pricing.leads.getStats.queryOptions({
			input: { organizationId },
		}),
	);

	if (!stats) return null;

	const openCount =
		(stats.byStatus.NEW ?? 0) +
		(stats.byStatus.STUDYING ?? 0) +
		(stats.byStatus.QUOTED ?? 0) +
		(stats.byStatus.NEGOTIATING ?? 0);

	const cards = [
		{
			label: t("pricing.leads.stats.total"),
			value: String(stats.total),
			icon: Users,
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
			iconColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: t("pricing.leads.stats.open"),
			value: String(openCount),
			icon: Clock,
			iconBg: "bg-orange-50 dark:bg-orange-950/30",
			iconColor: "text-orange-600 dark:text-orange-400",
		},
		{
			label: t("pricing.leads.stats.won"),
			value: String(stats.byStatus.WON ?? 0),
			icon: CheckCircle,
			iconBg: "bg-green-50 dark:bg-green-950/30",
			iconColor: "text-green-600 dark:text-green-400",
			valueColor: "text-green-600 dark:text-green-400",
		},
		{
			label: t("pricing.leads.stats.estimatedValue"),
			value: formatCurrency(stats.openEstimatedValue),
			icon: Banknote,
			iconBg: "bg-purple-50 dark:bg-purple-950/30",
			iconColor: "text-purple-600 dark:text-purple-400",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.label} className="rounded-2xl border-border">
					<CardContent className="flex items-center gap-3 p-4">
						<div
							className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
						>
							<card.icon className={`h-5 w-5 ${card.iconColor}`} />
						</div>
						<div className="min-w-0">
							<p className={`text-lg font-bold ${card.valueColor ?? "text-foreground"}`}>
								{card.value}
							</p>
							<p className="text-xs text-muted-foreground truncate">
								{card.label}
							</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
