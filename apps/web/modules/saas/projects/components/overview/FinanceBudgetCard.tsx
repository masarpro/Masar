"use client";

import { CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface FinanceBudgetCardProps {
	contractValue: number;
	actualExpenses: number;
	totalPayments: number;
	remaining: number;
	claimsPaid: number;
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(Math.abs(value));
}

function formatCompact(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
	return String(value);
}

export function FinanceBudgetCard({
	contractValue,
	actualExpenses,
	totalPayments,
	remaining,
	claimsPaid,
}: FinanceBudgetCardProps) {
	const t = useTranslations();

	const expensePct =
		contractValue > 0
			? Math.round((actualExpenses / contractValue) * 100)
			: 0;
	const paymentPct =
		contractValue > 0
			? Math.round((totalPayments / contractValue) * 100)
			: 0;
	const remainingPct =
		contractValue > 0 ? Math.round((remaining / contractValue) * 100) : 0;
	const retentionAmount = claimsPaid > 0 ? Math.round(claimsPaid * 0.1) : 0;
	const retentionPct = claimsPaid > 0 ? 10 : 0;

	// Simplified profit/cash calculations
	const expectedProfit = remaining;
	const profitMargin =
		contractValue > 0
			? Math.round((expectedProfit / contractValue) * 100)
			: 0;
	const cashFlow = totalPayments - actualExpenses;

	// Budget bar percentage
	const budgetBarPct = Math.min(expensePct, 100);

	// Next payment estimate (10% milestone or upcoming)
	const nextPaymentAmount = Math.round(contractValue * 0.1);

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
						<Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
						{t("projects.commandCenter.financeAndBudget")}
					</h3>
				</div>
				<span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
					{t("projects.commandCenter.budget")}:{" "}
					{formatCompact(contractValue)}
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3.5 p-5">
				{/* 4 KPI Grid */}
				<div className="grid grid-cols-2 gap-2">
					{/* Actual Expenses */}
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.actualExpensesLabel")}
						</div>
						<div
							className="text-[15px] font-bold leading-tight text-red-500"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(actualExpenses)}
						</div>
						<div className="text-[9px] text-slate-400">
							{expensePct}%{" "}
							{t("projects.commandCenter.ofContract")}
						</div>
					</div>
					{/* Payments Received */}
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.receipts")}
						</div>
						<div
							className="text-[15px] font-bold leading-tight text-emerald-500"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(totalPayments)}
						</div>
						<div className="text-[9px] text-slate-400">
							{t("projects.commandCenter.advancePayment")}{" "}
							{paymentPct}%
						</div>
					</div>
					{/* Remaining */}
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.remainingContract")}
						</div>
						<div
							className="text-[15px] font-bold leading-tight text-slate-700 dark:text-slate-200"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(remaining)}
						</div>
						<div className="text-[9px] text-slate-400">
							{remainingPct}%{" "}
							{t("projects.commandCenter.ofContract")}
						</div>
					</div>
					{/* Retention */}
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.retention")}
						</div>
						<div
							className="text-[15px] font-bold leading-tight text-amber-500"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(retentionAmount)}
						</div>
						<div className="text-[9px] text-slate-400">
							{retentionPct}%{" "}
							{t("projects.commandCenter.ofClaims")}
						</div>
					</div>
				</div>

				{/* Budget Bar */}
				<div className="flex flex-col gap-1.5">
					<div className="flex justify-between text-[10px] text-slate-400">
						<span>
							{t("projects.commandCenter.budgetUsed")}
						</span>
						<strong
							className="text-[11px] text-slate-700 dark:text-slate-300"
							dir="ltr"
						>
							{formatCompact(actualExpenses)} /{" "}
							{formatCompact(contractValue)} ر.س
						</strong>
					</div>
					<div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
						{budgetBarPct > 0 && (
							<div
								className="flex h-full items-center justify-center bg-gradient-to-l from-emerald-400 to-emerald-500"
								style={{
									width: `${Math.max(budgetBarPct, 3)}%`,
								}}
							>
								{budgetBarPct >= 8 && (
									<span className="text-[8px] font-semibold text-white">
										{expensePct}%
									</span>
								)}
							</div>
						)}
					</div>
					<div className="flex flex-wrap gap-2.5">
						<div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
							<span className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />
							{t(
								"projects.commandCenter.actualExpensesLabel",
							)}
						</div>
						<div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
							<span className="h-1.5 w-1.5 rounded-sm bg-slate-200 dark:bg-slate-600" />
							{t("projects.commandCenter.remaining")}{" "}
							{remainingPct}%
						</div>
					</div>
				</div>

				{/* Profit & Cash Flow */}
				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.expectedProfit")}
						</div>
						<div
							className="text-[15px] font-bold leading-tight text-emerald-700 dark:text-emerald-400"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(expectedProfit)}
						</div>
						<div className="text-[9px] text-slate-400">
							{t("projects.commandCenter.margin")}{" "}
							{profitMargin}%
						</div>
					</div>
					<div className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="truncate text-[10px] text-slate-400">
							{t("projects.commandCenter.cashFlow")}
						</div>
						<div
							className={`text-[15px] font-bold leading-tight ${cashFlow >= 0 ? "text-emerald-500" : "text-red-500"}`}
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{cashFlow < 0 ? "-" : ""}
							{formatNumber(cashFlow)}
						</div>
						<div className="text-[9px] text-slate-400">
							{t(
								"projects.commandCenter.receiptsMinusExpenses",
							)}
						</div>
					</div>
				</div>

				{/* Next Payment */}
				<div className="relative mt-auto overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-bl from-emerald-50 to-emerald-50/50 p-3.5 dark:border-emerald-800/30 dark:from-emerald-950/30 dark:to-emerald-950/10">
					<div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10" />
					<div className="relative flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<CreditCard className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
							<span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
								{t("projects.commandCenter.nextPayment")}
							</span>
						</div>
						<span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-semibold text-white">
							{t("projects.commandCenter.milestonePayment")}
						</span>
					</div>
					<div
						className="relative mt-1.5 text-xl font-bold text-emerald-700 dark:text-emerald-400"
						dir="ltr"
						style={{ textAlign: "right" }}
					>
						{formatNumber(nextPaymentAmount)} ر.س
					</div>
				</div>
			</div>
		</div>
	);
}
