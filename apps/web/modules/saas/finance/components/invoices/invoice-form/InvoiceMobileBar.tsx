"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@saas/shared/lib/invoice-constants";
import { Button } from "@ui/components/button";
import { Save, FileCheck } from "lucide-react";

interface InvoiceMobileBarProps {
	totalAmount: number;
	currency: string;
	isEditMode: boolean;
	isBusy: boolean;
	invoiceStatus?: string;
	onIssueClick: () => void;
}

export function InvoiceMobileBar({
	totalAmount,
	currency,
	isEditMode,
	isBusy,
	invoiceStatus,
	onIssueClick,
}: InvoiceMobileBarProps) {
	const t = useTranslations();

	return (
		<div className="fixed bottom-0 inset-x-0 z-50 sm:hidden backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-[11px] text-muted-foreground">{t("finance.summary.total")}</p>
					<p className="text-lg font-bold text-primary">
						{formatCurrency(totalAmount)}
						<span className="text-xs font-normal text-muted-foreground ms-1">{currency}</span>
					</p>
				</div>
				<div className="flex gap-2">
					<Button type="submit" variant="outline" size="sm" disabled={isBusy} className="rounded-xl h-9">
						<Save className="h-4 w-4 me-1" />
						{isEditMode ? t("finance.invoices.saveChanges") : t("finance.invoices.saveAsDraft")}
					</Button>
					{(!isEditMode || invoiceStatus === "DRAFT") && (
						<Button type="button" size="sm" disabled={isBusy} onClick={onIssueClick} className="rounded-xl h-9">
							<FileCheck className="h-4 w-4 me-1" />
							{t("finance.invoices.issueInvoice")}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
