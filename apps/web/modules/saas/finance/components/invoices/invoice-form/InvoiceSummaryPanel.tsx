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
		<div className="bg-card rounded-2xl border-2 border-border overflow-hidden flex flex-col">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
				<div className="flex size-8 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
					<Receipt className="h-[15px] w-[15px]" />
				</div>
				<span className="text-sm font-semibold text-card-foreground">{t("finance.summary.total")}</span>
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
					<div className="mt-2 space-y-1.5 pt-2 border-t border-dashed border-border">
						<div className="flex justify-between text-sm text-success">
							<span>{t("finance.invoices.paidAmount")}</span>
							<span>-<Currency amount={invoice.paidAmount} /></span>
						</div>
						<div className={`flex justify-between text-sm font-bold ${remainingAmount > 0 ? "text-chart-1" : "text-success"}`}>
							<span>{t("finance.invoices.remainingAmount")}</span>
							<span><Currency amount={remainingAmount} /></span>
						</div>
					</div>
				)}
				{/* Total Bar */}
				<div className="mt-4 p-4 rounded-xl bg-primary flex items-center justify-between">
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
