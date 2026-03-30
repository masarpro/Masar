"use client";

import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@saas/shared/lib/invoice-constants";
import { AmountSummary } from "../../shared/AmountSummary";
import { Currency } from "../../shared/Currency";

interface InvoiceSummaryPanelProps {
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	currency: string;
	isEditMode: boolean;
	invoice?: {
		paidAmount: number;
	} | null;
	remainingAmount: number;
}

export function InvoiceSummaryPanel({
	subtotal,
	discountPercent,
	discountAmount,
	vatPercent,
	vatAmount,
	totalAmount,
	currency,
	isEditMode,
	invoice,
	remainingAmount,
}: InvoiceSummaryPanelProps) {
	const t = useTranslations();

	return (
		<div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
				<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-800/20 flex items-center justify-center">
					<Receipt className="h-[15px] w-[15px] text-pink-500" />
				</div>
				<span className="text-sm font-semibold text-foreground">{t("finance.summary.total")}</span>
			</div>
			<div className="p-5 flex-1 flex flex-col justify-between">
				<AmountSummary
					subtotal={subtotal}
					discountPercent={discountPercent}
					discountAmount={discountAmount}
					vatPercent={vatPercent}
					vatAmount={vatAmount}
					totalAmount={totalAmount}
				/>
				{isEditMode && invoice && invoice.paidAmount > 0 && (
					<div className="mt-2 space-y-1.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
						<div className="flex justify-between text-sm text-green-600 dark:text-green-400">
							<span>{t("finance.invoices.paidAmount")}</span>
							<span>-<Currency amount={invoice.paidAmount} /></span>
						</div>
						<div className={`flex justify-between text-sm font-bold ${remainingAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
							<span>{t("finance.invoices.remainingAmount")}</span>
							<span><Currency amount={remainingAmount} /></span>
						</div>
					</div>
				)}
				{/* Gradient Total Bar */}
				<div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 flex items-center justify-between shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
					<div>
						<div className="text-[11px] text-primary-foreground/70 font-medium tracking-wide">{t("finance.summary.total")}</div>
					</div>
					<div className="text-2xl font-extrabold text-primary-foreground font-mono tracking-tight flex items-baseline gap-1.5">
						{formatCurrency(totalAmount)}
						<span className="text-sm font-medium text-primary-foreground/75">{currency}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
