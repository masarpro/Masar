"use client";

import { Card, CardContent } from "@ui/components/card";
import { AlertTriangle, Calculator, HardHat, Hammer, PaintBucket, Zap, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { formatNumber } from "@shared/lib/formatters";

const sectionIcons: Record<string, any> = {
	STRUCTURAL: HardHat,
	FINISHING: PaintBucket,
	MEP: Zap,
	LABOR: Hammer,
	GENERAL: Package,
};

const sectionColors: Record<string, string> = {
	STRUCTURAL: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
	FINISHING: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
	MEP: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
	LABOR: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
	GENERAL: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
};

interface BOQSummaryCardsProps {
	summary: {
		totalItems: number;
		pricedItems: number;
		unpricedItems: number;
		sections: Record<string, { count: number; total: number }>;
		grandTotal: number;
	};
	onStartPricing?: () => void;
}

export function BOQSummaryCards({ summary, onStartPricing }: BOQSummaryCardsProps) {
	const t = useTranslations("projectBoq");
	const tCommon = useTranslations("common");

	const sectionKeys = ["STRUCTURAL", "FINISHING", "MEP", "LABOR", "GENERAL"] as const;

	return (
		<div className="space-y-4">
			{/* Items count + Grand total row */}
			<div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
				<Card className="rounded-2xl border border-slate-200 dark:border-slate-800">
					<CardContent className="p-3 sm:p-5">
						<div className="flex min-w-0 items-center gap-2 sm:gap-3">
							<div className="shrink-0 rounded-lg sm:rounded-xl bg-slate-100 p-1.5 sm:p-2.5 dark:bg-slate-800">
								<Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
							</div>
							<div className="min-w-0">
								<p className="truncate text-[11px] sm:text-sm text-slate-500 dark:text-slate-400">{t("summary.totalItems")}</p>
								<p className="text-lg sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{summary.totalItems}</p>
								<p className="truncate text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
									{summary.pricedItems} {t("filters.priced")} — {summary.unpricedItems} {t("filters.unpriced")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
					<CardContent className="p-3 sm:p-5">
						<div className="min-w-0">
							<p className="truncate text-[11px] sm:text-sm text-emerald-600 dark:text-emerald-400">{t("summary.grandTotal")}</p>
							<p className="truncate text-lg sm:text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
								{formatNumber(summary.grandTotal, 2)} <span className="text-xs sm:text-sm font-normal">{tCommon("sar")}</span>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Section cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
				{sectionKeys.map((key) => {
					const Icon = sectionIcons[key];
					const data = summary.sections[key] ?? { count: 0, total: 0 };
					return (
						<Card key={key} className="rounded-2xl border border-slate-200 dark:border-slate-800">
							<CardContent className="p-2.5 sm:p-4">
								<div className="flex min-w-0 items-center gap-2 mb-1.5 sm:mb-2">
									<div className={`shrink-0 rounded-lg p-1.5 ${sectionColors[key]}`}>
										<Icon className="h-3.5 w-3.5" />
									</div>
									<span className="truncate text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
										{t(`summary.${key.toLowerCase() as "structural" | "finishing" | "mep" | "labor" | "general"}`)}
									</span>
								</div>
								<p className="truncate text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
									{formatNumber(data.total, 2)} <span className="text-xs font-normal text-slate-400">{tCommon("sar")}</span>
								</p>
								<p className="truncate text-[10px] sm:text-xs text-slate-400">{data.count} {t("summary.totalItems").toLowerCase()}</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Unpriced warning */}
			{summary.unpricedItems > 0 && (
				<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
						<span className="text-sm text-amber-700 dark:text-amber-300">
							{t("unpricedWarning", { count: summary.unpricedItems })}
						</span>
					</div>
					{onStartPricing && (
						<Button variant="outline" size="sm" className="rounded-xl" onClick={onStartPricing}>
							{t("actions.startPricing")}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
