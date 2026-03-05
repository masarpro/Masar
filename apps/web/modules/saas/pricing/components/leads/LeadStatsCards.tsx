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
			bg: "bg-slate-50 dark:bg-slate-900/50",
			hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800/50",
			iconBg: "bg-slate-200/50 dark:bg-slate-700/50",
			iconColor: "text-slate-600 dark:text-slate-300",
			labelColor: "text-slate-500 dark:text-slate-400",
			valueColor: "text-slate-900 dark:text-slate-100",
		},
		{
			label: t("pricing.leads.stats.open"),
			value: String(openCount),
			icon: Clock,
			bg: "bg-amber-50 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
			iconBg: "bg-amber-200/50 dark:bg-amber-800/30",
			iconColor: "text-amber-600 dark:text-amber-400",
			labelColor: "text-amber-600 dark:text-amber-400",
			valueColor: "text-amber-700 dark:text-amber-300",
		},
		{
			label: t("pricing.leads.stats.won"),
			value: String(stats.byStatus.WON ?? 0),
			icon: CheckCircle2,
			bg: "bg-teal-50 dark:bg-teal-950/30",
			hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-900/30",
			iconBg: "bg-teal-200/50 dark:bg-teal-800/30",
			iconColor: "text-teal-600 dark:text-teal-400",
			labelColor: "text-teal-600 dark:text-teal-400",
			valueColor: "text-teal-700 dark:text-teal-300",
		},
		{
			label: t("pricing.leads.stats.estimatedValue"),
			value: formatCurrency(stats.openEstimatedValue),
			icon: Banknote,
			bg: "bg-indigo-50 dark:bg-indigo-950/30",
			hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
			iconBg: "bg-indigo-200/50 dark:bg-indigo-800/30",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			labelColor: "text-indigo-600 dark:text-indigo-400",
			valueColor: "text-indigo-700 dark:text-indigo-300",
			smallValue: true,
		},
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{cards.map((card) => (
				<div
					key={card.label}
					className={`group relative rounded-2xl ${card.bg} p-5 transition-all duration-200 ${card.hoverBg}`}
				>
					<div className="flex items-center justify-between">
						<div>
							<p className={`text-xs font-medium ${card.labelColor} uppercase tracking-wide`}>
								{card.label}
							</p>
							<p className={`${card.smallValue ? "text-2xl" : "text-3xl"} font-semibold mt-2 ${card.valueColor}`}>
								{card.value}
							</p>
						</div>
						<div className={`p-3 rounded-2xl ${card.iconBg}`}>
							<card.icon className={`h-5 w-5 ${card.iconColor}`} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
