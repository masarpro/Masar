"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	Banknote,
	CheckCircle2,
	Clock,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "@shared/lib/formatters";

interface LeadStatsCardsProps {
	organizationId: string;
}

export function LeadStatsCards({ organizationId }: LeadStatsCardsProps) {
	const t = useTranslations();

	const { data: stats } = useQuery(
		orpc.pricing.leads.getStats.queryOptions({
			input: { organizationId },
		}),
	) as { data: any };

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
			iconBg: "bg-muted",
			iconColor: "text-muted-foreground",
		},
		{
			label: t("pricing.leads.stats.open"),
			value: String(openCount),
			icon: Clock,
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
		},
		{
			label: t("pricing.leads.stats.won"),
			value: String(stats.byStatus.WON ?? 0),
			icon: CheckCircle2,
			iconBg: "bg-chart-3/15",
			iconColor: "text-chart-3",
		},
		{
			label: t("pricing.leads.stats.estimatedValue"),
			value: `${formatNumber(stats.openEstimatedValue, 0)} ر.س`,
			icon: Banknote,
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			smallValue: true,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="rounded-xl sm:rounded-2xl border-2 bg-card p-3 sm:p-5 transition-colors"
				>
					<div className="flex items-center justify-between gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{card.label}
							</p>
							<p className={`${card.smallValue ? "text-base sm:text-2xl" : "text-lg sm:text-3xl"} font-semibold mt-1 sm:mt-2 text-foreground break-words tabular-nums`}>
								{card.value}
							</p>
						</div>
						<div className={`h-[30px] w-[30px] rounded-lg ${card.iconBg} flex items-center justify-center`}>
							<card.icon className={`h-4 w-4 ${card.iconColor}`} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
