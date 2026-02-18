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
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const sections = [
		{
			title: t("finance.expenses.title"),
			description: t("finance.nav.expensesDescription"),
			icon: TrendingDown,
			href: `${financePath}/expenses`,
			newHref: `${financePath}/expenses/new`,
			newLabel: t("finance.expenses.new"),
			iconBg: "bg-red-100 dark:bg-red-900/50",
			iconColor: "text-red-600 dark:text-red-400",
			value: summary?.actualExpenses ?? 0,
		},
		{
			title: t("finance.payments.title"),
			description: t("finance.nav.paymentsDescription"),
			icon: TrendingUp,
			href: `${financePath}/payments`,
			newHref: `${financePath}/payments/new`,
			newLabel: t("finance.payments.new"),
			iconBg: "bg-green-100 dark:bg-green-900/50",
			iconColor: "text-green-600 dark:text-green-400",
			value: summary?.totalPayments ?? 0,
		},
		{
			title: t("finance.claims.title"),
			description: t("finance.nav.claimsDescription"),
			icon: Receipt,
			href: `${financePath}/claims`,
			newHref: `${financePath}/claims/new`,
			newLabel: t("finance.claims.new"),
			iconBg: "bg-amber-100 dark:bg-amber-900/50",
			iconColor: "text-amber-600 dark:text-amber-400",
			value: summary?.claimsPaid ?? 0,
		},
	];

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<FinanceSummary
				contractValue={summary?.contractValue ?? 0}
				actualExpenses={summary?.actualExpenses ?? 0}
				totalPayments={summary?.totalPayments ?? 0}
				remaining={summary?.remaining ?? 0}
				claimsPaid={summary?.claimsPaid ?? 0}
			/>

			{/* Quick Navigation */}
			<div className="grid gap-4 sm:grid-cols-3">
				{sections.map((section) => (
					<Link key={section.title} href={section.href}>
						<Card className="rounded-2xl transition-shadow hover:shadow-md cursor-pointer h-full">
							<CardContent className="p-5">
								<div className="flex items-start gap-3">
									<div className={`rounded-xl ${section.iconBg} p-2.5`}>
										<section.icon
											className={`h-5 w-5 ${section.iconColor}`}
										/>
									</div>
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-slate-900 dark:text-slate-100">
											{section.title}
										</h3>
										<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
