"use client";

import {
	Receipt,
	Clock,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassStatCard } from "@ui/components/glass-stat-card";
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
		<div className="grid grid-cols-3 gap-3">
			<GlassStatCard
				colorScheme="sky"
				icon={<Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
				title={t("finance.stats.invoices")}
				value={stats?.invoices.total ?? 0}
				subtitle={<Currency amount={stats?.invoices.totalValue ?? 0} />}
			/>
			<GlassStatCard
				colorScheme="amber"
				icon={<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
				title={t("finance.stats.outstanding")}
				value={<Currency amount={stats?.invoices.outstandingValue ?? 0} />}
				subtitle={<>{stats?.invoices.overdue ?? 0} {t("finance.stats.overdue")}</>}
			/>
			<GlassStatCard
				colorScheme="sky"
				icon={<Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
				title={t("finance.stats.clients")}
				value={stats?.clients.total ?? 0}
				subtitle={t("finance.stats.activeClients")}
			/>
		</div>
	);
}
