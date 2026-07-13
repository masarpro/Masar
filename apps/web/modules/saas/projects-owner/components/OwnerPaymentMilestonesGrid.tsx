"use client";

import { formatSARArabic } from "@shared/lib/formatters";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface OwnerPaymentTerm {
	id: string;
	type: string;
	label: string | null;
	amount: number;
	paidAmount: number;
	remainingAmount: number;
	progressPercent: number;
	isComplete: boolean;
}

interface OwnerPaymentMilestonesGridProps {
	terms: OwnerPaymentTerm[];
	currentTermId: string | null;
}

export function OwnerPaymentMilestonesGrid({
	terms,
	currentTermId,
}: OwnerPaymentMilestonesGridProps) {
	const t = useTranslations();

	if (terms.length === 0) {
		return null;
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{terms.map((term, index) => {
				const isCurrent = term.id === currentTermId;
				const progress = Math.max(0, Math.min(100, term.progressPercent));

				return (
					<div
						key={term.id}
						className={cn(
							"rounded-2xl border-2 p-4 transition-colors",
							term.isComplete
								? "border-success/40 bg-success/10"
								: isCurrent
									? "border-chart-4 bg-chart-4/10 ring-1 ring-chart-4"
									: "border-border bg-card",
						)}
					>
						<div className="mb-3 flex items-start justify-between gap-2">
							<div className="min-w-0">
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground text-xs">{index + 1}.</span>
									<h4 className="truncate font-semibold text-card-foreground text-sm">
										{term.label || t("ownerPortal.payments.stage")}
									</h4>
								</div>
							</div>
							{term.isComplete ? (
								<CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
							) : isCurrent ? (
								<span className="shrink-0 rounded-full bg-chart-4/15 px-2 py-0.5 text-[10px] font-semibold text-chart-4">
									{t("ownerPortal.payments.currentStage")}
								</span>
							) : null}
						</div>

						<div className="mb-3 flex items-center gap-2">
							<Progress value={progress} className="h-2 flex-1" />
							<span className="w-9 text-end text-muted-foreground text-xs">
								{Math.round(progress)}%
							</span>
						</div>

						<div className="grid grid-cols-3 gap-2 text-center text-xs">
							<div>
								<p className="text-muted-foreground">
									{t("ownerPortal.payments.required")}
								</p>
								<p className="font-semibold text-card-foreground">
									{formatSARArabic(term.amount)}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("ownerPortal.payments.paidAmount")}
								</p>
								<p className="font-semibold text-success">
									{formatSARArabic(term.paidAmount)}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">
									{t("ownerPortal.payments.remaining")}
								</p>
								<p className="font-semibold text-chart-1">
									{formatSARArabic(term.remainingAmount)}
								</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
