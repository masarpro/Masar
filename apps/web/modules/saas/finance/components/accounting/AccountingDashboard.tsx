"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import {
	AlertTriangle,
	Clock,
	FileEdit,
	Send,
	TrendingUp,
	TrendingDown,
	DollarSign,
	CreditCard,
	ClipboardList,
	RefreshCw,
	CheckCircle,
	Users,
	Building2,
	HeartPulse,
	UserMinus,
	CalendarCheck,
} from "lucide-react";
import { formatAccounting } from "./formatters";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
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
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		orpc.accounting.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const healthQuery = useQuery(
		orpc.accounting.health.check.queryOptions({
			input: { organizationId },
		}),
	);

	const drawingsSummaryQuery = useQuery(
		orpc.accounting.ownerDrawings.companySummary.queryOptions({
			input: { organizationId },
		}),
	);

	const backfillMutation = useMutation({
		...orpc.accounting.backfill.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.accounting.key() });
		},
	});

	if (isLoading || !data) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4">
			{/* الجوال: شريط إحصائيات مضغوط (المؤشرات الرئيسية) */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("finance.accounting.totalAssets"),
						value: formatAccounting(data.totalAssets),
						icon: DollarSign,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("finance.accounting.totalLiabilities"),
						value: formatAccounting(data.totalLiabilities),
						icon: CreditCard,
						iconClassName: "text-destructive",
						iconBgClassName: "bg-destructive/15",
					},
					{
						label: t("finance.accounting.incomeStatement.netProfit"),
						value: formatAccounting(data.netProfitThisMonth),
						icon: TrendingUp,
						iconClassName: "text-success",
						iconBgClassName: "bg-success/15",
						valueClassName:
							data.netProfitThisMonth >= 0 ? "text-success" : "text-destructive",
					},
					{
						label: t("finance.accounting.dashboard.draftEntries"),
						value: data.draftEntriesCount,
						icon: ClipboardList,
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
						valueClassName: "text-chart-1",
					},
				]}
			/>

			{/* Primary KPI Cards — For the Contractor (الديسكتوب كما هو) */}
			<div className="hidden gap-3 sm:grid sm:grid-cols-4">
				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.totalAssets")}</p>
								<p className="text-lg font-bold text-card-foreground mt-1">
									{formatAccounting(data.totalAssets)}
								</p>
							</div>
							<div className="p-2.5 bg-chart-4/15 rounded-xl">
								<DollarSign className="h-5 w-5 text-chart-4" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.totalLiabilities")}</p>
								<p className="text-lg font-bold text-card-foreground mt-1">
									{formatAccounting(data.totalLiabilities)}
								</p>
							</div>
							<div className="p-2.5 bg-destructive/15 rounded-xl">
								<CreditCard className="h-5 w-5 text-destructive" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.incomeStatement.netProfit")}</p>
								<p className={`text-lg font-bold mt-1 ${data.netProfitThisMonth >= 0 ? "text-success" : "text-destructive"}`}>
									{formatAccounting(data.netProfitThisMonth)}
								</p>
							</div>
							<div className="p-2.5 bg-success/15 rounded-xl">
								<TrendingUp className="h-5 w-5 text-success" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.draftEntries")}</p>
								<p className="text-lg font-bold text-chart-1 mt-1">
									{data.draftEntriesCount}
								</p>
							</div>
							<div className="p-2.5 bg-chart-1/15 rounded-xl">
								<ClipboardList className="h-5 w-5 text-chart-1" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* الجوال: شريط إحصائيات مضغوط (المؤشرات الثانوية) */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("finance.accounting.dashboard.totalRevenue"),
						value: formatAccounting(data.totalRevenue),
						icon: TrendingUp,
						iconClassName: "text-success",
						iconBgClassName: "bg-success/15",
						valueClassName: "text-success",
					},
					{
						label: t("finance.accounting.dashboard.totalExpenses"),
						value: formatAccounting(data.totalExpenses),
						icon: TrendingDown,
						iconClassName: "text-destructive",
						iconBgClassName: "bg-destructive/15",
						valueClassName: "text-destructive",
					},
					{
						label: t("finance.accounting.dashboard.accountsReceivable"),
						value: formatAccounting(data.accountsReceivable),
						icon: Users,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
						valueClassName: "text-chart-4",
					},
					{
						label: t("finance.accounting.dashboard.accountsPayable"),
						value: formatAccounting(data.accountsPayable),
						icon: Building2,
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
						valueClassName: "text-chart-1",
					},
				]}
			/>

			{/* Secondary KPI Cards — Revenue, Expenses, Receivable, Payable (الديسكتوب كما هو) */}
			<div className="hidden gap-3 sm:grid sm:grid-cols-4">
				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.totalRevenue")}</p>
								<p className="text-lg font-bold text-success mt-1">
									{formatAccounting(data.totalRevenue)}
								</p>
							</div>
							<div className="p-2.5 bg-success/15 rounded-xl">
								<TrendingUp className="h-5 w-5 text-success" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.totalExpenses")}</p>
								<p className="text-lg font-bold text-destructive mt-1">
									{formatAccounting(data.totalExpenses)}
								</p>
							</div>
							<div className="p-2.5 bg-destructive/15 rounded-xl">
								<TrendingDown className="h-5 w-5 text-destructive" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.accountsReceivable")}</p>
								<p className="text-lg font-bold text-chart-4 mt-1">
									{formatAccounting(data.accountsReceivable)}
								</p>
							</div>
							<div className="p-2.5 bg-chart-4/15 rounded-xl">
								<Users className="h-5 w-5 text-chart-4" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl border-2 shadow-none">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.accountsPayable")}</p>
								<p className="text-lg font-bold text-chart-1 mt-1">
									{formatAccounting(data.accountsPayable)}
								</p>
							</div>
							<div className="p-2.5 bg-chart-1/15 rounded-xl">
								<Building2 className="h-5 w-5 text-chart-1" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Owner Drawings YTD */}
			{drawingsSummaryQuery.data && (
				<>
					{/* الجوال: شريط مضغوط */}
					<CompactStatGrid
						className="sm:hidden"
						items={[
							{
								label: t("finance.accounting.dashboard.ownerDrawingsYtd"),
								value: formatAccounting(
									drawingsSummaryQuery.data.totalDrawingsThisYear,
								),
								icon: UserMinus,
								iconClassName: "text-destructive",
								iconBgClassName: "bg-destructive/15",
								valueClassName: "text-destructive",
							},
						]}
					/>
					{/* الديسكتوب كما هو */}
					<div className="hidden gap-3 sm:grid sm:grid-cols-3">
					<Card className="rounded-2xl border-2 shadow-none">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs text-muted-foreground">{t("finance.accounting.dashboard.ownerDrawingsYtd")}</p>
									<p className="text-lg font-bold text-destructive mt-1">
										{formatAccounting(drawingsSummaryQuery.data.totalDrawingsThisYear)}
									</p>
								</div>
								<div className="p-2.5 bg-destructive/15 rounded-xl">
									<UserMinus className="h-5 w-5 text-destructive" />
								</div>
							</div>
						</CardContent>
					</Card>
					</div>
				</>
			)}

			{/* Health Status */}
			{healthQuery.data && (
				<div className={`flex items-center gap-2 p-3 rounded-xl border ${
					healthQuery.data.isHealthy
						? "bg-success/10 border-success/30"
						: "bg-destructive/10 border-destructive/30"
				}`}>
					{healthQuery.data.isHealthy ? (
						<CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
					) : (
						<HeartPulse className="h-4 w-4 text-destructive flex-shrink-0" />
					)}
					<span className={`text-sm ${healthQuery.data.isHealthy ? "text-success" : "text-destructive"}`}>
						{healthQuery.data.isHealthy
							? t("finance.accounting.health.healthy")
							: t("finance.accounting.health.issues", {
								count: (healthQuery.data.unbalancedEntries?.length ?? 0) +
									(healthQuery.data.invoicesWithoutEntries?.length ?? 0) +
									(healthQuery.data.orphanedInvoiceEntries?.length ?? 0) +
									(healthQuery.data.expensesWithoutEntries?.length ?? 0),
							})}
					</span>
					<Link href={`${basePath}/accounting-reports/health`} className={`text-sm hover:underline ms-auto ${healthQuery.data.isHealthy ? "text-success" : "text-destructive"}`}>
						{t("finance.accountingReports.viewReport")}
					</Link>
				</div>
			)}

			{/* Alerts */}
			{!data.isTrialBalanceBalanced && (
				<div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/30">
					<AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
					<span className="text-sm text-destructive">
						{t("finance.accounting.dashboard.trialBalanceAlert")}
					</span>
					<Link href={`${basePath}/accounting-reports/trial-balance`} className="text-sm text-destructive hover:underline ms-auto">
						{t("finance.accountingReports.viewReport")}
					</Link>
				</div>
			)}

			{data.staleOpenPeriods > 0 && (
				<div className="flex items-center gap-2 p-3 bg-chart-1/10 rounded-xl border border-chart-1/30">
					<Clock className="h-4 w-4 text-chart-1 flex-shrink-0" />
					<span className="text-sm text-chart-1">
						{t("finance.accounting.dashboard.stalePeriodsAlert", { count: data.staleOpenPeriods })}
					</span>
					<Link href={`${basePath}/accounting-periods`} className="text-sm text-chart-1 hover:underline ms-auto">
						{t("finance.accounting.periods.title")}
					</Link>
				</div>
			)}

			{/* Backfill Result */}
			{backfillMutation.data && backfillMutation.data.total > 0 && (
				<div className="flex items-center gap-2 p-3 bg-success/10 rounded-xl border border-success/30">
					<CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
					<span className="text-sm text-success">
						{t("finance.accounting.backfill.success", { total: backfillMutation.data.total })}
					</span>
					{backfillMutation.data.errors.length > 0 && (
						<span className="text-sm text-chart-1 ms-2">
							({backfillMutation.data.errors.length} {t("finance.accounting.backfill.errors", { count: backfillMutation.data.errors.length })})
						</span>
					)}
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
				<Button
					variant="outline"
					size="sm"
					className="rounded-xl"
					onClick={() => backfillMutation.mutate({ organizationId })}
					disabled={backfillMutation.isPending}
				>
					<RefreshCw className={`h-4 w-4 me-1 ${backfillMutation.isPending ? "animate-spin" : ""}`} />
					{backfillMutation.isPending
						? t("finance.accounting.backfill.running")
						: t("finance.accounting.backfill.title")}
				</Button>
				<Link href={`${basePath}/owner-drawings/new`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<UserMinus className="h-4 w-4 me-1" />
						{t("finance.accounting.dashboard.newOwnerDrawing")}
					</Button>
				</Link>
				<Link href={`${basePath}/year-end-closing`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<CalendarCheck className="h-4 w-4 me-1" />
						{t("finance.accounting.dashboard.yearEndClosing")}
					</Button>
				</Link>
				<Link href={`/app/${organizationSlug}/settings/owners`}>
					<Button variant="outline" size="sm" className="rounded-xl">
						<Users className="h-4 w-4 me-1" />
						{t("finance.accounting.dashboard.manageOwners")}
					</Button>
				</Link>
			</div>
		</div>
	);
}
