"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Banknote, Building2, ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

// The chart (and with it the whole recharts library) loads as its own chunk
// AFTER the panel frame + balances have painted — recharts stays out of the
// org-home initial bundle (same pattern as PricingPipelineChart). The loading
// placeholder reserves the chart's exact box, so it fades in with zero layout
// shift; recharts needs the browser to measure its container anyway, so there
// is no SSR value lost.
const FinancePanelChart = dynamic(() => import("./FinancePanelChart"), {
	ssr: false,
	loading: () => (
		<div className="w-full flex-1 min-h-[100px] max-h-44 sm:max-h-none" />
	),
});

interface FinancePanelProps {
	bankBalance: number;
	cashBalance: number;
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
	organizationSlug: string;
}

export function FinancePanel({
	bankBalance,
	cashBalance,
	financialTrend,
	organizationSlug,
}: FinancePanelProps) {
	const t = useTranslations();

	return (
		<div className={`${glassCard} flex flex-col p-4 overflow-hidden`}>
			{/* 2 balance cards */}
			<div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
				{/* Bank Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm p-3 hover:shadow-md transition-all"
				>
					<div className="flex items-center gap-2 mb-1.5">
						<div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("dashboard.kpi.bankBalance")}
						</span>
					</div>
					<p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
						<Currency amount={Number(bankBalance ?? 0)} />
					</p>
				</Link>

				{/* Cash Balance */}
				<Link
					href={`/app/${organizationSlug}/finance/banks`}
					className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm p-3 hover:shadow-md transition-all"
				>
					<div className="flex items-center gap-2 mb-1.5">
						<div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						</div>
						<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("dashboard.kpi.cashBalance")}
						</span>
					</div>
					<p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
						<Currency amount={Number(cashBalance ?? 0)} />
					</p>
				</Link>
			</div>

			{/* Cash Flow Chart — matches finance page style */}
			<div className="flex-1 flex flex-col min-h-0">
				<div className="flex items-center justify-between mb-1.5 shrink-0">
					<span className="text-sm font-bold text-slate-700 dark:text-slate-300">
						{t("dashboard.financePanel.cashFlowTitle")}
					</span>
					<Link
						href={`/app/${organizationSlug}/finance`}
						className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
					>
						<span>{t("dashboard.cashFlow.goToFinance")}</span>
						<ChevronLeft className="h-3 w-3" />
					</Link>
				</div>

				<FinancePanelChart financialTrend={financialTrend} />
			</div>
		</div>
	);
}
