"use client";

import { CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface FinanceBudgetCardProps {
	contractValue: number;
	/** القيمة الصافية (قبل الضريبة) — أساس هامش الربح */
	netContractValue?: number;
	actualExpenses: number;
	totalPayments: number;
	remaining: number;
	claimsPaid: number;
	expectedProfit: number;
	/** إجمالي المستخلصات المستحقة خلال 30 يوماً — لا تُعرض بطاقة "الدفعة القادمة" بدونها */
	upcomingClaimsTotal?: number;
	upcomingClaimsCount?: number;
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US", {
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
	netContractValue,
	actualExpenses,
	totalPayments,
	remaining,
	claimsPaid,
	expectedProfit,
	upcomingClaimsTotal = 0,
	upcomingClaimsCount = 0,
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

	// Expected profit comes from the backend NET of VAT — the margin base is
	// the net contract value so a zero-cost project reads 100%, not 115%.
	const profitBase =
		netContractValue && netContractValue > 0
			? netContractValue
			: contractValue;
	const profitMargin =
		profitBase > 0 ? Math.round((expectedProfit / profitBase) * 100) : 0;
	const cashFlow = totalPayments - actualExpenses;

	// Budget bar percentage
	const budgetBarPct = Math.min(expensePct, 100);

	// Next payment — real upcoming claims only (no synthetic 10% estimate)
	const nextPaymentAmount = upcomingClaimsTotal;
	const hasUpcomingPayment = upcomingClaimsCount > 0 && upcomingClaimsTotal > 0;

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border-2 bg-card">
			{/* Header */}
			<div className="flex items-center justify-between border-b-2 px-5 py-3.5">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-xl bg-chart-4/15">
						<Wallet className="h-4 w-4 text-chart-4" />
					</div>
					<h3 className="text-[15px] font-semibold text-card-foreground">
						{t("projects.commandCenter.financeAndBudget")}
					</h3>
				</div>
				<span className="inline-flex items-center rounded-full bg-chart-4/15 px-3 py-1 text-xs font-semibold text-chart-4">
					{t("projects.commandCenter.budget")}:{" "}
					{formatCompact(contractValue)}
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3.5 p-5">
				{/* 4 KPI Grid */}
				<div className="grid grid-cols-2 gap-2">
					{/* Actual Expenses */}
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.actualExpensesLabel")}
						</div>
						<div
							className="text-base font-bold leading-tight text-destructive"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(actualExpenses)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{expensePct}%{" "}
							{t("projects.commandCenter.ofContract")}
						</div>
					</div>
					{/* Payments Received */}
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.receipts")}
						</div>
						<div
							className="text-base font-bold leading-tight text-chart-4"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(totalPayments)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{t("projects.commandCenter.advancePayment")}{" "}
							{paymentPct}%
						</div>
					</div>
					{/* Remaining */}
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.remainingContract")}
						</div>
						<div
							className="text-base font-bold leading-tight text-card-foreground"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(remaining)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{remainingPct}%{" "}
							{t("projects.commandCenter.ofContract")}
						</div>
					</div>
					{/* Retention */}
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.retention")}
						</div>
						<div
							className="text-base font-bold leading-tight text-chart-1"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(retentionAmount)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{retentionPct}%{" "}
							{t("projects.commandCenter.ofClaims")}
						</div>
					</div>
				</div>

				{/* Budget Bar */}
				<div className="flex flex-col gap-1.5">
					<div className="flex justify-between text-[11px] text-muted-foreground">
						<span>
							{t("projects.commandCenter.budgetUsed")}
						</span>
						<strong
							className="text-xs text-card-foreground"
							dir="ltr"
						>
							{formatCompact(actualExpenses)} /{" "}
							{formatCompact(contractValue)} {t("common.sar")}
						</strong>
					</div>
					<div className="flex h-6 w-full overflow-hidden rounded-md bg-muted">
						{budgetBarPct > 0 && (
							<div
								className="flex h-full items-center justify-center bg-chart-4"
								style={{
									width: `${Math.max(budgetBarPct, 3)}%`,
								}}
							>
								{budgetBarPct >= 8 && (
									<span className="text-[9px] font-semibold text-white">
										{expensePct}%
									</span>
								)}
							</div>
						)}
					</div>
					<div className="flex flex-wrap gap-2.5">
						<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<span className="h-1.5 w-1.5 rounded-sm bg-chart-4" />
							{t(
								"projects.commandCenter.actualExpensesLabel",
							)}
						</div>
						<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
							<span className="h-1.5 w-1.5 rounded-sm bg-border" />
							{t("projects.commandCenter.remaining")}{" "}
							{remainingPct}%
						</div>
					</div>
				</div>

				{/* Profit & Cash Flow */}
				<div className="grid grid-cols-2 gap-2">
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.expectedProfit")}
						</div>
						<div
							className={`text-base font-bold leading-tight ${expectedProfit >= 0 ? "text-chart-4" : "text-destructive"}`}
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{expectedProfit < 0 ? "-" : ""}
							{formatNumber(expectedProfit)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{t("projects.commandCenter.margin")}{" "}
							{profitMargin}%
						</div>
					</div>
					<div className="rounded-lg border bg-muted/50 p-2.5">
						<div className="truncate text-[11px] text-muted-foreground">
							{t("projects.commandCenter.cashFlow")}
						</div>
						<div
							className={`text-base font-bold leading-tight ${cashFlow >= 0 ? "text-chart-4" : "text-destructive"}`}
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{cashFlow < 0 ? "-" : ""}
							{formatNumber(cashFlow)}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{t(
								"projects.commandCenter.receiptsMinusExpenses",
							)}
						</div>
					</div>
				</div>

				{/* Next Payment — real upcoming claims only */}
				{hasUpcomingPayment && (
					<div className="relative mt-auto overflow-hidden rounded-xl border border-chart-4 bg-chart-4/15 p-3.5 dark:border-chart-4/30 dark:bg-chart-4/20">
						<div className="absolute -start-4 -top-4 h-16 w-16 rounded-full bg-chart-4/10" />
						<div className="relative flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<CreditCard className="h-3.5 w-3.5 text-chart-4 dark:text-chart-4" />
								<span className="text-xs font-semibold text-chart-4 dark:text-chart-4">
									{t("projects.commandCenter.nextPayment")}
								</span>
							</div>
							<span className="rounded-full bg-chart-4 px-2 py-0.5 text-[10px] font-semibold text-white">
								{t("projects.commandCenter.milestonePayment")}
							</span>
						</div>
						<div
							className="relative mt-1.5 text-xl font-bold text-chart-4 dark:text-chart-4"
							dir="ltr"
							style={{ textAlign: "right" }}
						>
							{formatNumber(nextPaymentAmount)} {t("common.sar")}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
