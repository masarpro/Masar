"use client";

import { formatSAR } from "@shared/lib/formatters";
import { useTranslations } from "next-intl";
import { Progress } from "@ui/components/progress";

interface PaymentProgressBarProps {
	collectionPercent: number;
	totalCollected: number;
	remaining: number;
}

export function PaymentProgressBar({
	collectionPercent,
	totalCollected,
	remaining,
}: PaymentProgressBarProps) {
	const t = useTranslations();

	return (
		<div className="rounded-2xl border-2 bg-card p-4">
			<div className="mb-2 flex items-center justify-between text-sm">
				<span className="text-muted-foreground">
					{t("projectPayments.collectionProgress")}
				</span>
				<span className="font-mono font-semibold text-chart-4">
					{collectionPercent}%
				</span>
			</div>
			<Progress
				value={collectionPercent}
				className="h-2.5 bg-muted [&>div]:bg-chart-4"
			/>
			<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{t("projectPayments.totalPaid")}: {formatSAR(totalCollected)}
				</span>
				<span>
					{t("projectPayments.totalRemaining")}: {formatSAR(remaining)}
				</span>
			</div>
		</div>
	);
}
