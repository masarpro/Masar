"use client";

import {
	Calculator,
	FileText,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Currency } from "@saas/finance/components/shared/Currency";

interface PricingBalanceCardsProps {
	studiesValue: number;
	activeQuotationsValue: number;
	leadsOpenValue: number;
}

export function PricingBalanceCards({
	studiesValue,
	activeQuotationsValue,
	leadsOpenValue,
}: PricingBalanceCardsProps) {
	const t = useTranslations();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{/* Total Studies Value */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
						<Calculator className="h-5 w-5 text-sky-600 dark:text-sky-400" />
					</div>
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("pricing.dashboard.overview.studiesValue")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={studiesValue} />
				</p>
			</div>

			{/* Active Quotations */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("pricing.dashboard.overview.activeQuotations")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={activeQuotationsValue} />
				</p>
			</div>

			{/* Leads Pipeline */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
						<Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
					</div>
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("pricing.dashboard.overview.leadsPipeline")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={leadsOpenValue} />
				</p>
			</div>
		</div>
	);
}
