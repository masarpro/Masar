"use client";

import { useTranslations } from "next-intl";
import { PaymentsTable } from "./PaymentsTable";

interface Payment {
	id: string;
	paymentNo: string;
	amount: number;
	date: string | Date;
	paymentMethod: string;
	referenceNo?: string | null;
	description?: string | null;
	note?: string | null;
	contractTerm?: { id: string; label: string | null; type: string } | null;
	destinationAccount?: { id: string; name: string } | null;
	createdBy?: { id: string; name: string } | null;
}

interface FreePaymentsSectionProps {
	organizationId: string;
	projectId: string;
	payments: Payment[];
	totalCollected: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function FreePaymentsSection({
	organizationId,
	projectId,
	payments,
	totalCollected,
}: FreePaymentsSectionProps) {
	const t = useTranslations();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
					{t("projectPayments.freePayments")}
				</h3>
				<span className="text-sm font-medium text-sky-600 dark:text-sky-400">
					{t("projectPayments.total")}: {formatCurrency(totalCollected)}
				</span>
			</div>
			<PaymentsTable
				organizationId={organizationId}
				projectId={projectId}
				payments={payments}
				showTermColumn={false}
			/>
		</div>
	);
}
