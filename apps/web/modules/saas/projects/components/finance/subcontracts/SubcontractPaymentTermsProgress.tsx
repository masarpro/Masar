"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { formatCurrency } from "./subcontract-shared";

interface TermProgress {
	id: string;
	label?: string | null;
	type: string;
	amount: number;
	paidAmount: number;
	remainingAmount: number;
	progressPercent: number;
	isComplete: boolean;
}

interface TermsProgressData {
	terms: TermProgress[];
	nextIncompleteTermId?: string | null;
}

export interface SubcontractPaymentTermsProgressProps {
	termsProgress: TermsProgressData;
	progress: number;
}

export const SubcontractPaymentTermsProgress = React.memo(function SubcontractPaymentTermsProgress({
	termsProgress,
	progress,
}: SubcontractPaymentTermsProgressProps) {
	const t = useTranslations();

	if (!termsProgress.terms.length) return null;

	return (
		<div className="overflow-hidden rounded-2xl border border-chart-4 bg-white dark:border-chart-4 dark:bg-muted">
			<div className="flex items-center justify-between border-b border-chart-4 p-5 dark:border-chart-4">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-chart-4/15 p-2 dark:bg-chart-4/20">
						<FileText className="h-5 w-5 text-chart-4 dark:text-chart-4" />
					</div>
					<h2 className="font-semibold text-chart-4 dark:text-chart-4">
						{t("subcontracts.detail.paymentTerms")}
					</h2>
				</div>
				<span className="text-sm font-medium text-chart-4 dark:text-chart-4">
					{progress.toFixed(0)}% {t("subcontracts.detail.complete")}
				</span>
			</div>
			<div className="divide-y divide-border dark:divide-border">
				{termsProgress.terms.map((term) => {
					const isNext = term.id === termsProgress.nextIncompleteTermId;
					return (
						<div key={term.id} className="flex items-center gap-4 px-5 py-3">
							{/* Status icon */}
							{term.isComplete ? (
								<CheckCircle2 className="h-5 w-5 shrink-0 text-chart-4" />
							) : isNext ? (
								<Clock className="h-5 w-5 shrink-0 text-chart-4" />
							) : (
								<div className="h-5 w-5 shrink-0 rounded-full border-2 border-border dark:border-border" />
							)}

							{/* Info */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
										{term.label || t(`subcontracts.termTypes.${term.type}`)}
									</span>
									{isNext && (
										<Badge className="border-0 bg-chart-4/15 text-[10px] text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
											{t("subcontracts.detail.currentTerm")}
										</Badge>
									)}
								</div>
								{/* Progress bar */}
								<div className="mt-1 flex items-center gap-2">
									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted dark:bg-muted">
										<div
											className={`h-full rounded-full transition-all ${term.isComplete ? "bg-chart-4" : isNext ? "bg-chart-4" : "bg-muted"}`}
											style={{ width: `${term.progressPercent}%` }}
										/>
									</div>
									<span className="w-10 text-end text-[10px] text-muted-foreground">
										{term.progressPercent.toFixed(0)}%
									</span>
								</div>
							</div>

							{/* Amounts */}
							<div className="text-end text-xs">
								<p className="font-semibold text-muted-foreground dark:text-muted-foreground">
									{formatCurrency(term.amount)}
								</p>
								<p className="text-muted-foreground">
									{t("subcontracts.detail.paid")}: {formatCurrency(term.paidAmount)}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});
