"use client";

import {
	Users,
	Clock,
	TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassStatCard } from "@ui/components/glass-stat-card";

interface PricingStatsCardsProps {
	activeClients: number;
	expiringQuotations: number;
	conversionRate: number;
}

export function PricingStatsCards({
	activeClients,
	expiringQuotations,
	conversionRate,
}: PricingStatsCardsProps) {
	const t = useTranslations();

	return (
		<div className="grid grid-cols-3 gap-3">
			<GlassStatCard
				colorScheme="sky"
				icon={<Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
				title={t("pricing.dashboard.stats.activeClients")}
				value={activeClients}
				subtitle={t("pricing.dashboard.stats.activeClientsSubtitle")}
			/>
			<GlassStatCard
				colorScheme="amber"
				icon={<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
				title={t("pricing.dashboard.stats.expiringQuotations")}
				value={expiringQuotations}
				subtitle={t("pricing.dashboard.stats.expiringQuotationsSubtitle")}
			/>
			<GlassStatCard
				colorScheme="blue"
				icon={<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
				title={t("pricing.dashboard.stats.conversionRate")}
				value={`${conversionRate}%`}
				subtitle={t("pricing.dashboard.stats.conversionRateSubtitle")}
			/>
		</div>
	);
}
