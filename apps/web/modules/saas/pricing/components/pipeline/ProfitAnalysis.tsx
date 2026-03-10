"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatAmount, formatPercent } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfitAnalysisData {
	totalCost: number;
	overheadAmount: number;
	profitAmount: number;
	contingencyAmount: number;
	sellingPriceBeforeVat: number;
	vatAmount: number;
	grandTotal: number;
	profitPercent: number;
	pricePerSqm: number;
	costPerSqm: number;
	buildingArea: number;
}

interface ProfitAnalysisProps {
	profitAnalysis?: ProfitAnalysisData | null;
	isLoading: boolean;
	isLumpSum?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProfitAnalysis({
	profitAnalysis,
	isLoading,
	isLumpSum,
}: ProfitAnalysisProps) {
	const t = useTranslations();

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-4">
					<Skeleton className="h-48 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!profitAnalysis) return null;

	const {
		totalCost,
		overheadAmount,
		profitAmount,
		contingencyAmount,
		sellingPriceBeforeVat,
		vatAmount,
		grandTotal,
		profitPercent,
		pricePerSqm,
		costPerSqm,
		buildingArea,
	} = profitAnalysis;

	const isPositive = profitAmount >= 0;

	// Cost bar width percentage (of grandTotal)
	const costPct = grandTotal > 0 ? (totalCost / grandTotal) * 100 : 0;
	const profitPct = grandTotal > 0 ? ((grandTotal - totalCost) / grandTotal) * 100 : 0;

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center gap-2">
					{isPositive ? (
						<TrendingUp className="h-4 w-4 text-emerald-600" />
					) : (
						<TrendingDown className="h-4 w-4 text-red-600" />
					)}
					{t("pricing.pipeline.profitAnalysisTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Cost Breakdown Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<tbody>
							<tr className="border-b">
								<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.totalCostLabel")}</td>
								<td className="px-3 py-2 tabular-nums text-left font-medium" dir="ltr">
									{formatAmount(totalCost)} ر.س
								</td>
							</tr>
							{!isLumpSum && (
								<>
									<tr className="border-b">
										<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.overheadLabel")}</td>
										<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
											+ {formatAmount(overheadAmount)} ر.س
										</td>
									</tr>
									<tr className="border-b">
										<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.profitLabel")}</td>
										<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
											+ {formatAmount(profitAmount)} ر.س
										</td>
									</tr>
									{contingencyAmount > 0 && (
										<tr className="border-b">
											<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.contingencyLabel")}</td>
											<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
												+ {formatAmount(contingencyAmount)} ر.س
											</td>
										</tr>
									)}
									<tr className="border-b bg-muted/30">
										<td className="px-3 py-2 font-medium">{t("pricing.pipeline.sellingPriceBeforeVat")}</td>
										<td className="px-3 py-2 tabular-nums text-left font-medium" dir="ltr">
											{formatAmount(sellingPriceBeforeVat)} ر.س
										</td>
									</tr>
									{vatAmount > 0 && (
										<tr className="border-b">
											<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.vatLabel")} (15%)</td>
											<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
												+ {formatAmount(vatAmount)} ر.س
											</td>
										</tr>
									)}
								</>
							)}
							<tr className="border-t-2 bg-primary/5">
								<td className="px-3 py-2 font-semibold">{t("pricing.pipeline.grandTotalLabel")}</td>
								<td className="px-3 py-2 tabular-nums text-left font-bold text-primary text-base" dir="ltr">
									{formatAmount(grandTotal)} ر.س
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Visual Bar: Cost vs Profit */}
				{!isLumpSum && grandTotal > 0 && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>{t("pricing.pipeline.totalCostLabel")}</span>
							<span>{t("pricing.pipeline.profitLabel")}</span>
						</div>
						<div className="h-6 rounded-full overflow-hidden flex bg-muted">
							<div
								className="bg-blue-500 h-full transition-all duration-300"
								style={{ width: `${costPct}%` }}
							/>
							<div
								className={cn(
									"h-full transition-all duration-300",
									isPositive ? "bg-emerald-500" : "bg-red-500",
								)}
								style={{ width: `${profitPct}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-blue-600 tabular-nums" dir="ltr">{formatPercent(costPct)}%</span>
							<span className={cn("tabular-nums", isPositive ? "text-emerald-600" : "text-red-600")} dir="ltr">
								{formatPercent(profitPct)}%
							</span>
						</div>
					</div>
				)}

				{/* KPI Cards */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
					<div className="rounded-lg border p-3 text-center">
						<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.profitLabel")}</p>
						<p className={cn(
							"text-sm font-bold tabular-nums",
							isPositive ? "text-emerald-600" : "text-red-600",
						)} dir="ltr">
							{formatAmount(profitAmount)} ر.س
						</p>
					</div>
					<div className="rounded-lg border p-3 text-center">
						<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.profitPercentLabel")}</p>
						<p className={cn(
							"text-sm font-bold tabular-nums",
							isPositive ? "text-emerald-600" : "text-red-600",
						)} dir="ltr">
							{formatPercent(profitPercent)}%
						</p>
					</div>
					{buildingArea > 0 && (
						<>
							<div className="rounded-lg border p-3 text-center">
								<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.pricePerSqm")}</p>
								<p className="text-sm font-bold tabular-nums" dir="ltr">
									{formatAmount(pricePerSqm)} ر.س
								</p>
							</div>
							<div className="rounded-lg border p-3 text-center">
								<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.costPerSqm")}</p>
								<p className="text-sm font-bold tabular-nums" dir="ltr">
									{formatAmount(costPerSqm)} ر.س
								</p>
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
