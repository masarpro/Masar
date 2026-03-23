"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import {
	AlertTriangle,
	Clock,
	FileEdit,
	Send,
	TrendingUp,
	DollarSign,
	CreditCard,
	ClipboardList,
} from "lucide-react";
import { formatAccounting } from "./formatters";
import Link from "next/link";

interface AccountingDashboardProps {
	organizationId: string;
	organizationSlug: string;
}

export function AccountingDashboard({
	organizationId,
	organizationSlug,
}: AccountingDashboardProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	const { data, isLoading } = useQuery(
		orpc.accounting.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	if (isLoading || !data) return null;

	return (
		<div className="space-y-4">
			{/* KPI Cards */}
			<div className="grid gap-3 sm:grid-cols-4">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-slate-500">{t("finance.accounting.totalAssets")}</p>
								<p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
									{formatAccounting(data.totalAssets)}
								</p>
							</div>
							<div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
								<DollarSign className="h-5 w-5 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-slate-500">{t("finance.accounting.totalLiabilities")}</p>
								<p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
									{formatAccounting(data.totalLiabilities)}
								</p>
							</div>
							<div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
								<CreditCard className="h-5 w-5 text-red-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-slate-500">{t("finance.accounting.incomeStatement.netProfit")}</p>
								<p className={`text-lg font-bold mt-1 ${data.netProfitThisMonth >= 0 ? "text-green-600" : "text-red-600"}`}>
									{formatAccounting(data.netProfitThisMonth)}
								</p>
							</div>
							<div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
								<TrendingUp className="h-5 w-5 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-slate-500">{t("finance.accounting.dashboard.draftEntries")}</p>
								<p className="text-lg font-bold text-amber-600 mt-1">
									{data.draftEntriesCount}
								</p>
							</div>
							<div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
								<ClipboardList className="h-5 w-5 text-amber-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Alerts */}
			{!data.isTrialBalanceBalanced && (
				<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
					<AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
					<span className="text-sm text-red-700 dark:text-red-300">
						{t("finance.accounting.dashboard.trialBalanceAlert")}
					</span>
					<Link href={`${basePath}/accounting-reports/trial-balance`} className="text-sm text-red-600 hover:underline ms-auto">
						{t("finance.accountingReports.viewReport")}
					</Link>
				</div>
			)}

			{data.staleOpenPeriods > 0 && (
				<div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
					<Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
					<span className="text-sm text-amber-700 dark:text-amber-300">
						{t("finance.accounting.dashboard.stalePeriodsAlert", { count: data.staleOpenPeriods })}
					</span>
					<Link href={`${basePath}/accounting-periods`} className="text-sm text-amber-600 hover:underline ms-auto">
						{t("finance.accounting.periods.title")}
					</Link>
				</div>
			)}

			{/* Quick Actions */}
			<div className="flex flex-wrap gap-2">
				<Link href={`${basePath}/journal-entries/new-adjustment`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<FileEdit className="h-4 w-4 me-1" />
						{t("finance.accounting.newEntry")}
					</Button>
				</Link>
				<Link href={`${basePath}/journal-entries`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<Send className="h-4 w-4 me-1" />
						{t("finance.accounting.postAllDrafts")}
					</Button>
				</Link>
				<Link href={`${basePath}/accounting-periods`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<Clock className="h-4 w-4 me-1" />
						{t("finance.accounting.periods.close")}
					</Button>
				</Link>
			</div>
		</div>
	);
}
