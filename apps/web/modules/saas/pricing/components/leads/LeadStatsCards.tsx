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
			iconBg: "bg-slate-50 dark:bg-slate-800/50",
			iconColor: "text-slate-600 dark:text-slate-300",
		},
		{
			label: t("pricing.leads.stats.open"),
			value: String(openCount),
			icon: Clock,
			iconBg: "bg-amber-50 dark:bg-amber-900/30",
			iconColor: "text-amber-600 dark:text-amber-400",
		},
		{
			label: t("pricing.leads.stats.won"),
			value: String(stats.byStatus.WON ?? 0),
			icon: CheckCircle2,
			iconBg: "bg-teal-50 dark:bg-teal-900/30",
			iconColor: "text-teal-600 dark:text-teal-400",
		},
		{
			label: t("pricing.leads.stats.estimatedValue"),
			value: formatCurrency(stats.openEstimatedValue),
			icon: Banknote,
			iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			smallValue: true,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50 p-5 transition-all duration-200 hover:shadow-xl"
				>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{card.label}
							</p>
							<p className={`${card.smallValue ? "text-2xl" : "text-3xl"} font-semibold mt-2 text-foreground`}>
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
