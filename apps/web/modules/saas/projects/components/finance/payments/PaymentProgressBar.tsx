"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@ui/components/progress";

interface PaymentProgressBarProps {
	collectionPercent: number;
	totalCollected: number;
	remaining: number;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function PaymentProgressBar({
	collectionPercent,
	totalCollected,
	remaining,
}: PaymentProgressBarProps) {
	const t = useTranslations();

	return (
		<div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50">
			<div className="mb-2 flex items-center justify-between text-sm">
				<span className="text-slate-600 dark:text-slate-400">
					{t("projectPayments.collectionProgress")}
				</span>
				<span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
					{collectionPercent}%
				</span>
			</div>
			<Progress
				value={collectionPercent}
				className="h-2.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-sky-500"
			/>
			<div className="mt-2 flex items-center justify-between text-xs text-slate-500">
				<span>
					{t("projectPayments.totalPaid")}: {formatCurrency(totalCollected)}
				</span>
				<span>
					{t("projectPayments.totalRemaining")}: {formatCurrency(remaining)}
				</span>
			</div>
		</div>
	);
}
