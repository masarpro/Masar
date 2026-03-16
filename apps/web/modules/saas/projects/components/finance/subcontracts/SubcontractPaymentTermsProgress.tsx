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
		<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-white dark:border-violet-800/30 dark:bg-slate-900/50">
			<div className="flex items-center justify-between border-b border-violet-100 p-5 dark:border-violet-800/30">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
						<FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
					</div>
					<h2 className="font-semibold text-violet-700 dark:text-violet-300">
						{t("subcontracts.detail.paymentTerms")}
					</h2>
				</div>
				<span className="text-sm font-medium text-violet-600 dark:text-violet-400">
					{progress.toFixed(0)}% {t("subcontracts.detail.complete")}
				</span>
			</div>
			<div className="divide-y divide-slate-100 dark:divide-slate-800">
				{termsProgress.terms.map((term) => {
					const isNext = term.id === termsProgress.nextIncompleteTermId;
					return (
						<div key={term.id} className="flex items-center gap-4 px-5 py-3">
							{/* Status icon */}
							{term.isComplete ? (
								<CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
							) : isNext ? (
								<Clock className="h-5 w-5 shrink-0 text-blue-500" />
							) : (
								<div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
							)}

							{/* Info */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-slate-800 dark:text-slate-200">
										{term.label || t(`subcontracts.termTypes.${term.type}`)}
									</span>
									{isNext && (
										<Badge className="border-0 bg-blue-100 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
											{t("subcontracts.detail.currentTerm")}
										</Badge>
									)}
								</div>
								{/* Progress bar */}
								<div className="mt-1 flex items-center gap-2">
									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
										<div
											className={`h-full rounded-full transition-all ${term.isComplete ? "bg-sky-500" : isNext ? "bg-blue-500" : "bg-slate-400"}`}
											style={{ width: `${term.progressPercent}%` }}
										/>
									</div>
									<span className="w-10 text-end text-[10px] text-slate-500">
										{term.progressPercent.toFixed(0)}%
									</span>
								</div>
							</div>

							{/* Amounts */}
							<div className="text-end text-xs">
								<p className="font-semibold text-slate-700 dark:text-slate-300">
									{formatCurrency(term.amount)}
								</p>
								<p className="text-slate-500">
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
