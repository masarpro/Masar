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
		<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
			<div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-border">
				<div className="flex items-center gap-2.5">
					<div className="flex size-8 items-center justify-center rounded-xl bg-success/15 text-success">
						<CreditCard className="h-[15px] w-[15px]" />
					</div>
					<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.payments")}</span>
					<span className="px-2.5 py-0.5 rounded-full bg-success/15 text-success text-[11px] font-bold">{payments.length}</span>
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
					<div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted border-2 border-border">
						<div>
							<p className="font-medium text-success text-sm">
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
							<Button type="button" variant="ghost" size="sm" onClick={() => onDeletePayment(payment.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8 p-0">
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
