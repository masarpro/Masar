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
						className="h-28 animate-pulse rounded-2xl bg-muted"
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
			bgColor: "bg-card",
			iconBg: "bg-chart-4/15",
			iconColor: "text-chart-4",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("paymentsHub.totalCollected"),
			value: totalCollected,
			icon: TrendingUp,
			bgColor: "bg-card",
			iconBg: "bg-success/15",
			iconColor: "text-success",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("paymentsHub.totalClaims"),
			value: totalClaims,
			icon: Receipt,
			bgColor: "bg-card",
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
		{
			title: t("paymentsHub.outstanding"),
			value: outstanding,
			icon: AlertCircle,
			bgColor: "bg-card",
			iconBg: "bg-destructive/15",
			iconColor: "text-destructive",
			textColor: "text-card-foreground",
			labelColor: "text-muted-foreground",
		},
	];

	return (
		<div className="space-y-4">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
				{cards.map((card) => (
					<div
						key={card.title}
						className={`flex min-w-0 rounded-xl sm:rounded-2xl border-2 ${card.bgColor} p-2.5 sm:p-4`}
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
				<div className="rounded-2xl border-2 bg-card p-4">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{t("projectPayments.summary")}
						</span>
						<span className="font-mono font-semibold text-chart-4">
							{collectionPercent.toFixed(0)}%
						</span>
					</div>
					<Progress
						value={collectionPercent}
						className="h-2.5 bg-muted [&>div]:bg-chart-4"
					/>
					<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
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
