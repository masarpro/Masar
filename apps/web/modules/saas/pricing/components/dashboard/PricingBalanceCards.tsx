"use client";

import {
	Calculator,
	FileText,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Currency } from "@saas/finance/components/shared/Currency";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";

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
		<>
			{/* الجوال: صفوف مدمجة (الثالثة تمتد بعرض كامل تلقائياً) */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("pricing.dashboard.overview.studiesValue"),
						value: <Currency amount={studiesValue} />,
						icon: Calculator,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
					},
					{
						label: t("pricing.dashboard.overview.activeQuotations"),
						value: <Currency amount={activeQuotationsValue} />,
						icon: FileText,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
					},
					{
						label: t("pricing.dashboard.overview.leadsPipeline"),
						value: <Currency amount={leadsOpenValue} />,
						icon: Users,
						iconClassName: "text-violet-600 dark:text-violet-400",
						iconBgClassName: "bg-violet-100 dark:bg-violet-900/30",
					},
				]}
			/>

			{/* الديسكتوب كما هو */}
			<div className="hidden sm:grid sm:grid-cols-3 gap-4">
				{/* Total Studies Value */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-chart-4/15 dark:bg-chart-4/20">
							<Calculator className="h-5 w-5 text-chart-4 dark:text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("pricing.dashboard.overview.studiesValue")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words tabular-nums">
						<Currency amount={studiesValue} />
					</p>
				</div>

				{/* Active Quotations */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-chart-4/15 dark:bg-chart-4/20">
							<FileText className="h-5 w-5 text-chart-4 dark:text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("pricing.dashboard.overview.activeQuotations")}
					</p>
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words tabular-nums">
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
					<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words tabular-nums">
						<Currency amount={leadsOpenValue} />
					</p>
				</div>
			</div>
		</>
	);
}
