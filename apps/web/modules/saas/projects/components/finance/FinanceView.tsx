"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import {
	TrendingDown,
	TrendingUp,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { FinanceSummary } from "./FinanceSummary";

interface FinanceViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function FinanceView({
	organizationId,
	organizationSlug,
	projectId,
}: FinanceViewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const financePath = `${basePath}/finance`;

	// Fetch summary data
	const { data: summary, isLoading: summaryLoading } = useQuery(
		orpc.projectFinance.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (summaryLoading) {
		return <DashboardSkeleton />;
	}

	const sections = [
		{
			title: t("finance.expenses.title"),
			description: t("finance.nav.expensesDescription"),
			icon: TrendingDown,
			href: `${financePath}/expenses`,
			newHref: `${financePath}/expenses/new`,
			newLabel: t("finance.expenses.new"),
			iconBg: "bg-destructive/15",
			iconColor: "text-destructive",
			value: summary?.actualExpenses ?? 0,
		},
		{
			title: t("finance.payments.title"),
			description: t("finance.nav.paymentsDescription"),
			icon: TrendingUp,
			href: `${financePath}/payments`,
			newHref: `${financePath}/payments/new`,
			newLabel: t("finance.payments.new"),
			iconBg: "bg-success/15",
			iconColor: "text-success",
			value: summary?.totalPayments ?? 0,
		},
		{
			title: t("finance.claims.title"),
			description: t("finance.nav.claimsDescription"),
			icon: Receipt,
			href: `${financePath}/claims`,
			newHref: `${financePath}/claims/new`,
			newLabel: t("finance.claims.new"),
			iconBg: "bg-chart-1/15",
			iconColor: "text-chart-1",
			value: summary?.claimsPaid ?? 0,
		},
	];

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<FinanceSummary
				contractValue={Number(summary?.contractValue ?? 0)}
				actualExpenses={Number(summary?.actualExpenses ?? 0)}
				totalPayments={Number(summary?.totalPayments ?? 0)}
				remaining={Number(summary?.remaining ?? 0)}
				claimsPaid={Number(summary?.claimsPaid ?? 0)}
			/>

			{/* Quick Navigation */}
			<div className="grid gap-4 sm:grid-cols-3">
				{sections.map((section) => (
					<Link key={section.title} href={section.href}>
						<Card className="rounded-2xl transition-colors hover:bg-accent cursor-pointer h-full">
							<CardContent className="p-5">
								<div className="flex items-start gap-3">
									<div className={`rounded-xl ${section.iconBg} p-2.5`}>
										<section.icon
											className={`h-5 w-5 ${section.iconColor}`}
										/>
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-card-foreground">
											{section.title}
										</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											{section.description}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
