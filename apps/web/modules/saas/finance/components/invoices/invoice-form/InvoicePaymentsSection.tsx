"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { Currency } from "../../shared/Currency";
import { formatDate } from "../../../lib/utils";

interface Payment {
	id: string;
	amount: number;
	paymentDate: Date | string;
	paymentMethod?: string | null;
	referenceNo?: string | null;
	notes?: string | null;
}

interface InvoicePaymentsSectionProps {
	payments: Payment[];
	canAddPayment: boolean;
	onAddPayment: () => void;
	onDeletePayment: (paymentId: string) => void;
}

export function InvoicePaymentsSection({
	payments,
	canAddPayment,
	onAddPayment,
	onDeletePayment,
}: InvoicePaymentsSectionProps) {
	const t = useTranslations();

	if (payments.length === 0) return null;

	return (
		<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
				<div className="flex items-center gap-2.5">
					<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center">
						<CreditCard className="h-[15px] w-[15px] text-green-500" />
					</div>
					<span className="text-sm font-semibold text-foreground">{t("finance.invoices.payments")}</span>
					<span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-bold">{payments.length}</span>
				</div>
				{canAddPayment && (
					<Button type="button" variant="ghost" size="sm" className="rounded-lg h-8 text-xs" onClick={onAddPayment}>
						<Plus className="h-3.5 w-3.5 me-1" />
						{t("finance.invoices.addPayment")}
					</Button>
				)}
			</div>
			<div className="p-4 space-y-2">
				{payments.map((payment) => (
					<div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40">
						<div>
							<p className="font-medium text-green-600 dark:text-green-400 text-sm">
								<Currency amount={payment.amount} />
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{formatDate(payment.paymentDate)}
								{payment.paymentMethod && ` - ${payment.paymentMethod}`}
								{payment.referenceNo && ` (${payment.referenceNo})`}
							</p>
							{payment.notes && (
								<p className="text-xs text-muted-foreground/70 mt-0.5">{payment.notes}</p>
							)}
						</div>
						{canAddPayment && (
							<Button type="button" variant="ghost" size="sm" onClick={() => onDeletePayment(payment.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg h-8 w-8 p-0">
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
