"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "./subcontract-shared";

export interface SubcontractFinanceSummaryProps {
	contractValue: number;
	coImpact: number;
	totalPaid: number;
	remaining: number;
	adjustedValue: number;
	progress: number;
	isOverBudget: boolean;
	scopeOfWork?: string | null;
}

export const SubcontractFinanceSummary = React.memo(function SubcontractFinanceSummary({
	contractValue,
	coImpact,
	totalPaid,
	remaining,
	adjustedValue,
	progress,
	isOverBudget,
	scopeOfWork,
}: SubcontractFinanceSummaryProps) {
	const t = useTranslations();

	return (
		<div className="p-3 sm:p-5">
			{/* Value Cards */}
			<div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
				<div className="min-w-0 rounded-xl bg-muted p-2.5 sm:p-3 dark:bg-muted">
					<p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{t("subcontracts.detail.originalValue")}
					</p>
					<p className="mt-1 truncate text-sm sm:text-lg font-bold tabular-nums text-muted-foreground dark:text-muted-foreground">
						{formatCurrency(contractValue)}
					</p>
				</div>
				<div className="min-w-0 rounded-xl bg-chart-1/20 p-2.5 sm:p-3 dark:bg-chart-1/25">
					<p className="truncate text-[10px] font-medium uppercase tracking-wide text-chart-1 dark:text-chart-1">
						{t("subcontracts.detail.changeOrders")}
					</p>
					<p className={`mt-1 truncate text-sm sm:text-lg font-bold tabular-nums ${coImpact >= 0 ? "text-chart-1 dark:text-chart-1" : "text-destructive"}`}>
						{coImpact >= 0 ? "+" : ""}{formatCurrency(coImpact)}
					</p>
				</div>
				<div className="min-w-0 rounded-xl bg-chart-4/15 p-2.5 sm:p-3 dark:bg-chart-4/20">
					<p className="truncate text-[10px] font-medium uppercase tracking-wide text-chart-4 dark:text-chart-4">
						{t("subcontracts.detail.totalPaid")}
					</p>
					<p className="mt-1 truncate text-sm sm:text-lg font-bold tabular-nums text-chart-4 dark:text-chart-4">
						{formatCurrency(totalPaid)}
					</p>
				</div>
				<div className={`min-w-0 rounded-xl p-2.5 sm:p-3 ${isOverBudget ? "bg-destructive/15 dark:bg-destructive/20" : "rounded-xl bg-chart-4/15 dark:bg-chart-4/20"}`}>
					<p className={`truncate text-[10px] font-medium uppercase tracking-wide ${isOverBudget ? "text-destructive dark:text-destructive" : "text-chart-4 dark:text-chart-4"}`}>
						{t("subcontracts.detail.remaining")}
					</p>
					<p className={`mt-1 truncate text-sm sm:text-lg font-bold tabular-nums ${isOverBudget ? "text-destructive dark:text-destructive" : "text-chart-4 dark:text-chart-4"}`}>
						{formatCurrency(remaining)}
					</p>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span className="text-muted-foreground">
						{t("subcontracts.detail.adjustedValue")}: <span className="font-semibold text-muted-foreground dark:text-muted-foreground">{formatCurrency(adjustedValue)}</span>
					</span>
					<span className={`font-bold ${isOverBudget ? "text-destructive" : "text-chart-4"}`}>
						{progress.toFixed(1)}%
					</span>
				</div>
				<div className="h-3 w-full overflow-hidden rounded-full bg-muted dark:bg-muted">
					<div
						className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : progress >= 100 ? "bg-chart-4" : "bg-chart-1"}`}
						style={{ width: `${Math.min(progress, 100)}%` }}
					/>
				</div>
			</div>

			{/* Scope */}
			{scopeOfWork && (
				<div className="mt-4 rounded-lg bg-muted p-3 dark:bg-muted">
					<p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t("subcontracts.form.scopeOfWork")}</p>
					<p className="text-sm text-muted-foreground dark:text-muted-foreground">{scopeOfWork}</p>
				</div>
			)}
		</div>
	);
});
