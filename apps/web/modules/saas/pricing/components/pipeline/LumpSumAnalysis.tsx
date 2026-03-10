"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface LumpSumAnalysisProps {
	profitAnalysis?: {
		totalCost: number;
		overheadAmount: number;
		lumpSumAnalysis?: {
			contractValue: number;
			expectedProfit: number;
			profitFromContract: number;
			safetyMargin: number;
		} | null;
	} | null;
	isLoading: boolean;
}

function fmt(n: number): string {
	if (n === 0) return "—";
	return n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
	return n.toLocaleString("ar-SA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function LumpSumAnalysis({
	profitAnalysis,
	isLoading,
}: LumpSumAnalysisProps) {
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

	if (!profitAnalysis?.lumpSumAnalysis) {
		return (
			<Card dir="rtl">
				<CardContent className="p-8 text-center text-muted-foreground">
					<AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
					<p>{t("pricing.pipeline.lumpSumNoContract")}</p>
				</CardContent>
			</Card>
		);
	}

	const { totalCost, overheadAmount } = profitAnalysis;
	const { contractValue, expectedProfit, profitFromContract, safetyMargin } = profitAnalysis.lumpSumAnalysis;

	const isPositive = expectedProfit >= 0;
	const isSafe = safetyMargin >= 10;

	// Bar proportions
	const totalWithOverhead = totalCost + overheadAmount;
	const costPct = contractValue > 0 ? (totalWithOverhead / contractValue) * 100 : 0;
	const profitPct = contractValue > 0 ? Math.max(0, (expectedProfit / contractValue) * 100) : 0;

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center gap-2">
					<ShieldAlert className="h-4 w-4 text-amber-600" />
					{t("pricing.pipeline.lumpSumTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Breakdown Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<tbody>
							<tr className="border-b bg-blue-50/50">
								<td className="px-3 py-2 font-medium">{t("pricing.pipeline.lumpSumContractValue")}</td>
								<td className="px-3 py-2 tabular-nums text-left font-bold text-blue-700" dir="ltr">
									{fmt(contractValue)} ر.س
								</td>
							</tr>
							<tr className="border-b">
								<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.totalCostLabel")}</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									{fmt(totalCost)} ر.س
								</td>
							</tr>
							<tr className="border-b">
								<td className="px-3 py-2 text-muted-foreground">{t("pricing.pipeline.overheadLabel")}</td>
								<td className="px-3 py-2 tabular-nums text-left" dir="ltr">
									+ {fmt(overheadAmount)} ر.س
								</td>
							</tr>
							<tr className={cn(
								"border-t-2",
								isPositive ? "bg-emerald-50/50" : "bg-red-50/50",
							)}>
								<td className="px-3 py-2 font-semibold">{t("pricing.pipeline.lumpSumExpectedProfit")}</td>
								<td className={cn(
									"px-3 py-2 tabular-nums text-left font-bold text-base",
									isPositive ? "text-emerald-700" : "text-red-700",
								)} dir="ltr">
									{fmt(expectedProfit)} ر.س
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Visual Bar: Cost vs Profit */}
				{contractValue > 0 && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>{t("pricing.pipeline.totalCostLabel")} + {t("pricing.pipeline.overheadLabel")}</span>
							<span>{t("pricing.pipeline.profitLabel")}</span>
						</div>
						<div className="h-6 rounded-full overflow-hidden flex bg-muted">
							<div
								className="bg-blue-500 h-full transition-all duration-300"
								style={{ width: `${Math.min(costPct, 100)}%` }}
							/>
							{isPositive && (
								<div
									className="bg-emerald-500 h-full transition-all duration-300"
									style={{ width: `${profitPct}%` }}
								/>
							)}
						</div>
					</div>
				)}

				{/* KPI Cards */}
				<div className="grid grid-cols-2 gap-3 pt-2">
					<div className="rounded-lg border p-3 text-center">
						<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.lumpSumProfitPercent")}</p>
						<p className={cn(
							"text-sm font-bold tabular-nums",
							isPositive ? "text-emerald-600" : "text-red-600",
						)} dir="ltr">
							{fmtPct(profitFromContract)}%
						</p>
					</div>
					<div className="rounded-lg border p-3 text-center">
						<p className="text-xs text-muted-foreground mb-1">{t("pricing.pipeline.lumpSumSafetyMargin")}</p>
						<div className="flex items-center justify-center gap-1.5">
							{isSafe ? (
								<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
							) : (
								<AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
							)}
							<p className={cn(
								"text-sm font-bold tabular-nums",
								isSafe ? "text-emerald-600" : "text-amber-600",
							)} dir="ltr">
								{fmtPct(safetyMargin)}%
							</p>
						</div>
					</div>
				</div>

				{/* Warning for negative profit */}
				{!isPositive && (
					<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
						<AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
						<p className="text-sm text-red-700">
							{t("pricing.pipeline.lumpSumLossWarning")}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
