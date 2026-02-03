"use client";

import { useTranslations } from "next-intl";
import {
	FileText,
	Receipt,
	Users,
	TrendingUp,
	Clock,
} from "lucide-react";
import { Currency } from "../shared/Currency";

interface FinanceStatsCardsProps {
	stats: {
		quotations: {
			total: number;
			totalValue: number;
		};
		invoices: {
			total: number;
			totalValue: number;
			paidValue: number;
			outstandingValue: number;
			overdue: number;
		};
		clients: {
			total: number;
		};
	};
}

export function FinanceStatsCards({ stats }: FinanceStatsCardsProps) {
	const t = useTranslations();

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
							{t("finance.stats.quotations")}
						</p>
						<p className="text-3xl font-semibold mt-2 text-blue-700 dark:text-blue-300">
							{stats.quotations.total}
						</p>
						<p className="text-sm text-blue-600/70 mt-1">
							<Currency amount={stats.quotations.totalValue} />
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-blue-200/50 dark:bg-blue-800/30">
						<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-green-50 dark:bg-green-950/30 p-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
							{t("finance.stats.invoices")}
						</p>
						<p className="text-3xl font-semibold mt-2 text-green-700 dark:text-green-300">
							{stats.invoices.total}
						</p>
						<p className="text-sm text-green-600/70 mt-1">
							<Currency amount={stats.invoices.totalValue} />
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-green-200/50 dark:bg-green-800/30">
						<Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
							{t("finance.stats.outstanding")}
						</p>
						<p className="text-2xl font-semibold mt-2 text-amber-700 dark:text-amber-300">
							<Currency amount={stats.invoices.outstandingValue} />
						</p>
						<p className="text-sm text-amber-600/70 mt-1">
							{stats.invoices.overdue} {t("finance.stats.overdue")}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-amber-200/50 dark:bg-amber-800/30">
						<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-teal-50 dark:bg-teal-950/30 p-5">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">
							{t("finance.stats.clients")}
						</p>
						<p className="text-3xl font-semibold mt-2 text-teal-700 dark:text-teal-300">
							{stats.clients.total}
						</p>
						<p className="text-sm text-teal-600/70 mt-1">
							{t("finance.stats.activeClients")}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-teal-200/50 dark:bg-teal-800/30">
						<Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
					</div>
				</div>
			</div>
		</div>
	);
}
