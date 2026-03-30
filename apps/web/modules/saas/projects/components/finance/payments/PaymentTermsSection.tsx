"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { ChevronDown, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PaymentsTable } from "./PaymentsTable";

interface Term {
	id: string;
	type: string;
	label: string | null;
	percent: number | null;
	amount: number | null;
	paidAmount: number;
	status: string;
	dueDate?: string | Date | null;
	projectPayments: Array<{
		id: string;
		paymentNo: string;
		amount: number;
		date: string | Date;
		paymentMethod: string;
		referenceNo?: string | null;
		description?: string | null;
		note?: string | null;
		destinationAccount?: { id: string; name: string } | null;
		createdBy?: { id: string; name: string } | null;
	}>;
}

interface PaymentTermsSectionProps {
	organizationId: string;
	projectId: string;
	terms: Term[];
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

const STATUS_ICON_MAP: Record<string, typeof CheckCircle2> = {
	PENDING: Clock,
	PARTIALLY_PAID: AlertCircle,
	FULLY_PAID: CheckCircle2,
};

const STATUS_COLOR_MAP: Record<string, string> = {
	PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	FULLY_PAID: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
};

export function PaymentTermsSection({
	organizationId,
	projectId,
	terms,
}: PaymentTermsSectionProps) {
	const t = useTranslations();

	return (
		<div className="space-y-3">
			<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
				{t("projectPayments.paymentTerms")}
			</h3>
			{terms.map((term) => {
				const termAmount = term.amount ?? 0;
				const paidPercent = termAmount > 0
					? Math.min(100, Math.round((term.paidAmount / termAmount) * 100))
					: 0;
				const statusKey = term.status in STATUS_ICON_MAP ? term.status : "PENDING";
				const StatusIcon = STATUS_ICON_MAP[statusKey] ?? Clock;
				const statusColor = STATUS_COLOR_MAP[statusKey] ?? STATUS_COLOR_MAP.PENDING;

				return (
					<Collapsible key={term.id}>
						<div className="rounded-xl border border-slate-200/60 bg-white/80 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50">
							<CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-right">
								<ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform [[data-state=open]>&]:rotate-180" />
								<div className="flex flex-1 flex-wrap items-center gap-2">
									<span className="font-medium text-slate-900 dark:text-slate-100">
										{term.label ?? t(`projectPayments.termTypes.${term.type}`)}
									</span>
									<Badge variant="secondary" className="text-xs">
										{t(`projectPayments.termTypes.${term.type}`)}
									</Badge>
									<Badge variant="secondary" className={statusColor}>
										<StatusIcon className="ms-1 h-3 w-3" />
										{t(`projectPayments.statuses.${statusKey}`)}
									</Badge>
								</div>
								<div className="flex shrink-0 items-center gap-4 text-sm">
									<span className="text-slate-500">
										{formatCurrency(term.paidAmount)} / {formatCurrency(termAmount)}
									</span>
									<span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
										{paidPercent}%
									</span>
								</div>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
									<Progress
										value={paidPercent}
										className="mb-4 h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-sky-500"
									/>
									<PaymentsTable
										organizationId={organizationId}
										projectId={projectId}
										payments={term.projectPayments}
									/>
								</div>
							</CollapsibleContent>
						</div>
					</Collapsible>
				);
			})}
		</div>
	);
}
