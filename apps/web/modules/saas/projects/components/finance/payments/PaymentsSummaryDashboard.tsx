"use client";

import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@ui/components/progress";
import {
	Banknote,
	TrendingUp,
	Receipt,
	AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface PaymentsSummaryDashboardProps {
	organizationId: string;
	projectId: string;
}

export function PaymentsSummaryDashboard({
	organizationId,
	projectId,
}: PaymentsSummaryDashboardProps) {
	const t = useTranslations();

	const { data: financeSummary, isLoading: financeLoading } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: termsData, isLoading: termsLoading } = useQuery(
		orpc.projectContract.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const isLoading = financeLoading || termsLoading;

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
					/>
				))}
			</div>
		);
	}

	const contractValue = Number(financeSummary?.adjustedContractValue ?? financeSummary?.contractValue ?? 0);
	const totalCollected = Number(financeSummary?.totalPayments ?? 0);
	const totalClaims = Number(financeSummary?.claimsApproved ?? 0) + Number(financeSummary?.claimsPaid ?? 0) + Number(financeSummary?.claimsSubmitted ?? 0);
	const outstanding = contractValue - totalCollected;
	const collectionPercent = contractValue > 0 ? Math.min(100, (totalCollected / contractValue) * 100) : 0;

	const cards = [
		{
			title: t("finance.summary.contractValue"),
			value: contractValue,
			icon: Banknote,
			bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
			iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
			iconColor: "text-indigo-600 dark:text-indigo-400",
			textColor: "text-indigo-700 dark:text-indigo-300",
			labelColor: "text-indigo-600/80 dark:text-indigo-400/80",
		},
		{
			title: t("paymentsHub.totalCollected"),
			value: totalCollected,
			icon: TrendingUp,
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			iconBg: "bg-chart-4/15 dark:bg-chart-4/20",
			iconColor: "text-chart-4 dark:text-chart-4",
			textColor: "text-chart-4 dark:text-chart-4",
			labelColor: "text-chart-4/80 dark:text-chart-4/80",
		},
		{
			title: t("paymentsHub.totalClaims"),
			value: totalClaims,
			icon: Receipt,
			bgColor: "bg-amber-50 dark:bg-amber-950/30",
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			textColor: "text-amber-700 dark:text-amber-300",
			labelColor: "text-amber-600/80 dark:text-amber-400/80",
		},
		{
			title: t("paymentsHub.outstanding"),
			value: outstanding,
			icon: AlertCircle,
			bgColor: "bg-red-50 dark:bg-red-950/30",
			iconBg: "bg-red-100 dark:bg-red-900/50",
			iconColor: "text-red-600 dark:text-red-400",
			textColor: "text-red-700 dark:text-red-300",
			labelColor: "text-red-600/80 dark:text-red-400/80",
		},
	];

	return (
		<div className="space-y-4">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
				{cards.map((card) => (
					<div
						key={card.title}
						className={`flex min-w-0 rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm sm:shadow-lg shadow-black/5 ${card.bgColor} p-2.5 sm:p-4 dark:border-slate-700/50`}
					>
						<div className="flex min-w-0 items-center gap-2 sm:gap-3">
							<div
								className={`shrink-0 rounded-lg sm:rounded-xl ${card.iconBg} p-1.5 sm:p-2.5`}
							>
								<card.icon
									className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${card.iconColor}`}
								/>
							</div>
							<div className="min-w-0 flex-1 overflow-hidden">
								<p
									className={`truncate text-[11px] sm:text-xs ${card.labelColor}`}
								>
									{card.title}
								</p>
								<p
									className={`truncate text-sm font-bold tabular-nums sm:text-lg sm:font-semibold ${card.textColor}`}
									title={formatSAR(card.value)}
								>
									{formatSAR(card.value)}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Overall Progress Bar */}
			{contractValue > 0 && (
				<div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-slate-600 dark:text-slate-400">
							{t("projectPayments.summary")}
						</span>
						<span className="font-mono font-semibold text-chart-4 dark:text-chart-4">
							{collectionPercent.toFixed(0)}%
						</span>
					</div>
					<Progress
						value={collectionPercent}
						className="h-2.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-chart-4"
					/>
					<div className="mt-2 flex items-center justify-between text-xs text-slate-500">
						<span>
							{t("projectPayments.totalPaid")}:{" "}
							{formatSAR(totalCollected)}
						</span>
						<span>
							{t("projectPayments.totalRemaining")}:{" "}
							{formatSAR(outstanding)}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
