"use client";

import {
	Receipt,
	Clock,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { Currency } from "../shared/Currency";

interface FinanceStats {
	invoices: {
		total: number;
		totalValue: number;
		outstandingValue: number;
		overdue: number;
	};
	clients: {
		total: number;
	};
}

interface StatsCardsProps {
	stats?: FinanceStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
	const t = useTranslations();

	return (
		<>
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("finance.stats.invoices"),
						value: stats?.invoices.total ?? 0,
						icon: Receipt,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
						valueClassName: "text-chart-4 dark:text-chart-4",
					},
					{
						label: t("finance.stats.outstanding"),
						value: <Currency amount={stats?.invoices.outstandingValue ?? 0} />,
						icon: Clock,
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
						valueClassName: "text-chart-1",
					},
					{
						label: t("finance.stats.clients"),
						value: stats?.clients.total ?? 0,
						icon: Users,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
						valueClassName: "text-chart-4 dark:text-chart-4",
					},
				]}
			/>

			{/* الديسكتوب كما هو */}
			<div className="hidden sm:grid sm:grid-cols-3 gap-3">
			<GlassStatCard
				colorScheme="sky"
				icon={<Receipt className="h-4 w-4 text-chart-4 dark:text-chart-4" />}
				title={t("finance.stats.invoices")}
				value={stats?.invoices.total ?? 0}
				subtitle={<Currency amount={stats?.invoices.totalValue ?? 0} />}
			/>
			<GlassStatCard
				colorScheme="amber"
				icon={<Clock className="h-4 w-4 text-chart-1" />}
				title={t("finance.stats.outstanding")}
				value={<Currency amount={stats?.invoices.outstandingValue ?? 0} />}
				subtitle={<>{stats?.invoices.overdue ?? 0} {t("finance.stats.overdue")}</>}
			/>
			<GlassStatCard
				colorScheme="sky"
				icon={<Users className="h-4 w-4 text-chart-4 dark:text-chart-4" />}
				title={t("finance.stats.clients")}
				value={stats?.clients.total ?? 0}
				subtitle={t("finance.stats.activeClients")}
			/>
			</div>
		</>
	);
}
