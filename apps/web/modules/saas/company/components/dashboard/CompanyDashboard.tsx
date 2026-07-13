"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import {
	Users,
	Receipt,
	Package,
	TrendingDown,
	AlertTriangle,
	Shield,
	CheckCircle2,
	Wrench,
	Archive,
} from "lucide-react";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";

const ChartSkeleton = () => (
	<div className="bg-card border-2 rounded-2xl p-5">
		<Skeleton className="h-[320px] w-full rounded-lg" />
	</div>
);

const EmployeesAnalyticsCard = dynamic(
	() => import("./EmployeesAnalyticsCard").then((m) => ({ default: m.EmployeesAnalyticsCard })),
	{ loading: ChartSkeleton, ssr: false },
);
const ExpensesAnalyticsCard = dynamic(
	() => import("./ExpensesAnalyticsCard").then((m) => ({ default: m.ExpensesAnalyticsCard })),
	{ loading: ChartSkeleton, ssr: false },
);
const AssetsAnalyticsCard = dynamic(
	() => import("./AssetsAnalyticsCard").then((m) => ({ default: m.AssetsAnalyticsCard })),
	{ loading: ChartSkeleton, ssr: false },
);

interface CompanyDashboardProps {
	organizationId: string;
}

export function CompanyDashboard({ organizationId }: CompanyDashboardProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery({
		...orpc.company.dashboard.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!data) return null;

	const formatCurrency = (amount: number) =>
		formatCurrencySuffixed(amount, t("common.sar"), 0);

	return (
		<div className="space-y-6">
			{/* Statistics Cards - Glass Morphism */}
			<div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
				<GlassStatCard
					colorScheme="blue"
					icon={<Users className="h-5 w-5 text-chart-4 dark:text-chart-4" />}
					title={t("company.dashboard.totalSalaries")}
					value={formatCurrency(Number(data.employees.totalMonthlyCost))}
					badge={<>{data.employees.totalActive} {t("company.dashboard.activeEmployees")}</>}
				/>
				<GlassStatCard
					colorScheme="orange"
					icon={<Receipt className="h-5 w-5 text-chart-1" />}
					title={t("company.dashboard.totalExpenses")}
					value={formatCurrency(Number(data.expenses.totalMonthlyAmount))}
					badge={<>{data.expenses.totalActiveExpenses} {t("company.dashboard.activeExpenses")}</>}
				/>
				<GlassStatCard
					colorScheme="sky"
					icon={<Package className="h-5 w-5 text-chart-4 dark:text-chart-4" />}
					title={t("company.dashboard.assetValue")}
					value={formatCurrency(Number(data.assets.totalValue))}
					badge={<>{data.assets.total} {t("company.dashboard.totalAssets")}</>}
				/>
				<GlassStatCard
					colorScheme="red"
					icon={<TrendingDown className="h-5 w-5 text-destructive" />}
					title={t("company.dashboard.totalMonthlyCost")}
					value={formatCurrency(Number(data.totalMonthlyCost))}
				/>
			</div>

			{/* Alerts Section */}
			{(data.alerts.upcomingPayments > 0 || data.alerts.expiringInsurance > 0) && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{data.alerts.upcomingPayments > 0 && (
						<div className="bg-card border-2 rounded-2xl p-5">
							<div className="flex items-center gap-2 mb-3">
								<div className="flex size-8 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
									<AlertTriangle className="h-4 w-4" />
								</div>
								<h3 className="text-sm font-semibold text-card-foreground">
									{t("company.dashboard.upcomingPayments")} ({data.alerts.upcomingPayments})
								</h3>
							</div>
							<ul className="space-y-2">
								{data.alerts.upcomingPaymentsList.map((payment: { expense: { id: string; name: string }; dueDate: Date }) => (
									<li key={payment.expense.id} className="flex justify-between text-sm">
										<span className="text-card-foreground">{payment.expense.name}</span>
										<span className="text-muted-foreground text-xs">
											{new Date(payment.dueDate).toLocaleDateString("ar-SA")}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{data.alerts.expiringInsurance > 0 && (
						<div className="bg-card border-2 rounded-2xl p-5">
							<div className="flex items-center gap-2 mb-3">
								<div className="flex size-8 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
									<Shield className="h-4 w-4" />
								</div>
								<h3 className="text-sm font-semibold text-card-foreground">
									{t("company.dashboard.expiringInsurance")} ({data.alerts.expiringInsurance})
								</h3>
							</div>
							<ul className="space-y-2">
								{data.alerts.expiringInsuranceList.map((asset: { id: string; name: string; insuranceExpiry: Date | null }) => (
									<li key={asset.id} className="flex justify-between text-sm">
										<span className="text-card-foreground">{asset.name}</span>
										<span className="text-muted-foreground text-xs">
											{asset.insuranceExpiry ? new Date(asset.insuranceExpiry).toLocaleDateString("ar-SA") : ""}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Analytics Charts */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<EmployeesAnalyticsCard
					employees={data.employees}
					formatCurrency={formatCurrency}
				/>
				<ExpensesAnalyticsCard
					expenses={data.expenses}
					formatCurrency={formatCurrency}
				/>
				<AssetsAnalyticsCard
					assets={data.assets}
					formatCurrency={formatCurrency}
				/>
			</div>

			{/* Asset Status Overview */}
			<div className="bg-card border-2 rounded-2xl p-5">
				<h3 className="text-sm font-semibold text-card-foreground mb-4">
					{t("company.dashboard.assetOverview")}
				</h3>
				<div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
					<div className="text-center p-3 rounded-xl border-2">
						<div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-xl bg-success/15 text-success">
							<CheckCircle2 className="h-4 w-4" />
						</div>
						<p className="text-2xl font-bold text-card-foreground">{data.assets.available}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.available")}</p>
					</div>
					<div className="text-center p-3 rounded-xl border-2">
						<div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Package className="h-4 w-4" />
						</div>
						<p className="text-2xl font-bold text-card-foreground">{data.assets.inUse}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.inUse")}</p>
					</div>
					<div className="text-center p-3 rounded-xl border-2">
						<div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
							<Wrench className="h-4 w-4" />
						</div>
						<p className="text-2xl font-bold text-card-foreground">{data.assets.maintenance}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.maintenance")}</p>
					</div>
					<div className="text-center p-3 rounded-xl border-2">
						<div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
							<Archive className="h-4 w-4" />
						</div>
						<p className="text-2xl font-bold text-card-foreground">{data.assets.retired}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.retired")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
