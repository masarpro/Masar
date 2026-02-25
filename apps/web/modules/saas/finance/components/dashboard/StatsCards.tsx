"use client";

import {
	Receipt,
	Clock,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
			{/* Invoices */}
			<div className="backdrop-blur-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/50 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
						{t("finance.stats.invoices")}
					</span>
				</div>
				<p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
					{stats?.invoices.total ?? 0}
				</p>
				<p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
					<Currency amount={stats?.invoices.totalValue ?? 0} />
				</p>
			</div>

			{/* Outstanding */}
			<div className="backdrop-blur-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/50 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					<span className="text-xs font-medium text-amber-600 dark:text-amber-400">
						{t("finance.stats.outstanding")}
					</span>
				</div>
				<p className="text-xl font-bold text-amber-700 dark:text-amber-300">
					<Currency amount={stats?.invoices.outstandingValue ?? 0} />
				</p>
				<p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
					{stats?.invoices.overdue ?? 0} {t("finance.stats.overdue")}
				</p>
			</div>

			{/* Clients */}
			<div className="backdrop-blur-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-100/50 dark:border-teal-900/50 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
					<span className="text-xs font-medium text-teal-600 dark:text-teal-400">
						{t("finance.stats.clients")}
					</span>
				</div>
				<p className="text-xl font-bold text-teal-700 dark:text-teal-300">
					{stats?.clients.total ?? 0}
				</p>
				<p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-1">
					{t("finance.stats.activeClients")}
				</p>
			</div>
		</div>
	);
}
