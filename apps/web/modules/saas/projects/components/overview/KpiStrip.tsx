"use client";

import {
	formatCurrencyCompact,
	calculateDaysRemaining,
} from "@shared/lib/formatters";
import { TrendingUp, Clock, Banknote, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm p-3";

interface KpiStripProps {
	project: {
		progress: number;
		endDate?: Date | string | null;
		startDate?: Date | string | null;
	};
	financeSummary?: {
		contractValue?: number;
		actualExpenses?: number;
	} | null;
}

export function KpiStrip({ project, financeSummary }: KpiStripProps) {
	const t = useTranslations();
	const daysRemaining = calculateDaysRemaining(project.endDate);
	const contractValue = financeSummary?.contractValue ?? 0;
	const actualExpenses = financeSummary?.actualExpenses ?? 0;
	const expenseRatio = contractValue > 0 ? (actualExpenses / contractValue) * 100 : 0;

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
			{/* Completion % */}
			<div className={glassCard}>
				<div className="flex items-center gap-2 mb-1">
					<TrendingUp className="h-4 w-4 text-teal-500" />
					<span className="text-[11px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.completion")}
					</span>
				</div>
				<p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
					{Math.round(project.progress)}%
				</p>
			</div>

			{/* Days Remaining */}
			<div className={glassCard}>
				<div className="flex items-center gap-2 mb-1">
					<Clock className="h-4 w-4 text-blue-500" />
					<span className="text-[11px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.daysLeft")}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
						{daysRemaining !== null ? Math.abs(daysRemaining) : "-"}
					</p>
					{daysRemaining !== null && (
						<span
							className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
								daysRemaining < 0
									? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
									: daysRemaining < 7
										? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
										: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
							}`}
						>
							{daysRemaining < 0
								? t("projects.commandCenter.delayed")
								: t("projects.commandCenter.onTrack")}
						</span>
					)}
				</div>
			</div>

			{/* Contract Value */}
			<div className={glassCard}>
				<div className="flex items-center gap-2 mb-1">
					<Banknote className="h-4 w-4 text-emerald-500" />
					<span className="text-[11px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.budget")}
					</span>
				</div>
				<p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
					{formatCurrencyCompact(contractValue)}
				</p>
			</div>

			{/* Expenses / Remaining */}
			<div className={glassCard}>
				<div className="flex items-center gap-2 mb-1">
					<AlertTriangle
						className={`h-4 w-4 ${expenseRatio > 80 ? "text-red-500" : "text-slate-400"}`}
					/>
					<span className="text-[11px] text-slate-500 dark:text-slate-400">
						{t("projects.commandCenter.expenses")}
					</span>
				</div>
				<p className={`text-2xl font-bold ${expenseRatio > 80 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
					{formatCurrencyCompact(actualExpenses)}
				</p>
				{expenseRatio > 80 && (
					<p className="text-[10px] text-red-500 mt-0.5">
						{t("projects.commandCenter.overspendWarning")}
					</p>
				)}
			</div>
		</div>
	);
}
