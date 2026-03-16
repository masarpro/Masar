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
		<div className="p-5">
			{/* Value Cards */}
			<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
					<p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
						{t("subcontracts.detail.originalValue")}
					</p>
					<p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
						{formatCurrency(contractValue)}
					</p>
				</div>
				<div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
					<p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
						{t("subcontracts.detail.changeOrders")}
					</p>
					<p className={`mt-1 text-lg font-bold ${coImpact >= 0 ? "text-amber-700 dark:text-amber-300" : "text-red-600"}`}>
						{coImpact >= 0 ? "+" : ""}{formatCurrency(coImpact)}
					</p>
				</div>
				<div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-950/20">
					<p className="text-[10px] font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
						{t("subcontracts.detail.totalPaid")}
					</p>
					<p className="mt-1 text-lg font-bold text-sky-700 dark:text-sky-300">
						{formatCurrency(totalPaid)}
					</p>
				</div>
				<div className={`rounded-xl p-3 ${isOverBudget ? "bg-red-50 dark:bg-red-950/20" : "rounded-xl bg-blue-50 dark:bg-blue-950/20"}`}>
					<p className={`text-[10px] font-medium uppercase tracking-wide ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
						{t("subcontracts.detail.remaining")}
					</p>
					<p className={`mt-1 text-lg font-bold ${isOverBudget ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}>
						{formatCurrency(remaining)}
					</p>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span className="text-slate-500">
						{t("subcontracts.detail.adjustedValue")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(adjustedValue)}</span>
					</span>
					<span className={`font-bold ${isOverBudget ? "text-red-600" : "text-sky-600"}`}>
						{progress.toFixed(1)}%
					</span>
				</div>
				<div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
					<div
						className={`h-full rounded-full transition-all ${isOverBudget ? "bg-red-500" : progress >= 100 ? "bg-sky-500" : "bg-orange-500"}`}
						style={{ width: `${Math.min(progress, 100)}%` }}
					/>
				</div>
			</div>

			{/* Scope */}
			{scopeOfWork && (
				<div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/30">
					<p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{t("subcontracts.form.scopeOfWork")}</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">{scopeOfWork}</p>
				</div>
			)}
		</div>
	);
});
