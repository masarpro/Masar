"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	BarChart3,
	Receipt,
	Users,
	Package,
	CheckCircle2,
	Clock,
	Banknote,
	Wrench,
} from "lucide-react";

interface CompanyReportsProps {
	organizationId: string;
}

export function CompanyReports({ organizationId }: CompanyReportsProps) {
	const t = useTranslations();

	const { data: dashboard, isLoading } = useQuery(
		orpc.company.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: expenseSummary } = useQuery(
		orpc.company.expenses.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const formatCurrency = (amount: number) =>
		formatCurrencySuffixed(amount, t("common.sar"), 0);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!dashboard) return null;

	return (
		<div className="space-y-6">
			{/* Monthly Summary */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<BarChart3 className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.reports.monthlySummary")}
					</h3>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-muted-foreground">{t("company.reports.costItem")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.reports.monthlyAmount")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.reports.annualAmount")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow className="border-b-2 hover:bg-accent">
							<TableCell className="font-medium text-card-foreground">{t("company.reports.salariesAndAllowances")}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.employees.totalMonthlySalaries))}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.employees.totalMonthlySalaries) * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-b-2 hover:bg-accent">
							<TableCell className="font-medium text-card-foreground">{t("company.reports.gosiContributions")}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.employees.totalMonthlyGosi))}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.employees.totalMonthlyGosi) * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-b-2 hover:bg-accent">
							<TableCell className="font-medium text-card-foreground">{t("company.reports.recurringExpenses")}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.expenses.totalMonthlyAmount))}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.expenses.totalAnnualAmount))}</TableCell>
						</TableRow>
						<TableRow className="border-b-2 hover:bg-accent">
							<TableCell className="font-medium text-card-foreground">{t("company.reports.assetRentals")}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.assets.totalMonthlyRent))}</TableCell>
							<TableCell className="text-card-foreground">{formatCurrency(Number(dashboard.assets.totalMonthlyRent) * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-t-2 hover:bg-transparent">
							<TableCell className="font-bold text-card-foreground">{t("company.reports.totalOverhead")}</TableCell>
							<TableCell className="font-bold text-destructive">{formatCurrency(Number(dashboard.totalMonthlyCost))}</TableCell>
							<TableCell className="font-bold text-destructive">{formatCurrency(Number(dashboard.totalMonthlyCost) * 12)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			{/* Expenses by Category */}
			{expenseSummary?.byCategory && (
				<div className="bg-card border-2 rounded-2xl overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b-2">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Receipt className="h-5 w-5 text-chart-4" />
						</div>
						<h3 className="text-sm font-semibold text-card-foreground">
							{t("company.reports.expensesByCategory")}
						</h3>
					</div>
					<Table>
						<TableHeader>
							<TableRow className="border-b-2 hover:bg-transparent">
								<TableHead className="text-muted-foreground">{t("company.expenses.category")}</TableHead>
								<TableHead className="text-muted-foreground">{t("company.reports.monthlyAmount")}</TableHead>
								<TableHead className="text-muted-foreground">{t("company.reports.percentage")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Object.entries(expenseSummary.byCategory)
								.sort(([, a], [, b]) => (b as number) - (a as number))
								.map(([category, amount]) => (
									<TableRow key={category} className="border-b-2 hover:bg-accent">
										<TableCell className="text-card-foreground">{t(`company.expenses.categories.${category}`)}</TableCell>
										<TableCell className="font-semibold text-card-foreground">{formatCurrency(amount as number)}</TableCell>
										<TableCell>
											<span className="text-xs font-medium text-muted-foreground">
												{expenseSummary.totalMonthlyAmount > 0
													? ((amount as number) / expenseSummary.totalMonthlyAmount * 100).toFixed(1) + "%"
													: "0%"}
											</span>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Workforce Summary */}
			<div className="bg-card border-2 rounded-2xl p-5">
				<div className="flex items-center gap-3 mb-5">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Users className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.reports.workforceSummary")}
					</h3>
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
							<CheckCircle2 className="h-4 w-4 text-chart-4" />
						</div>
						<p className="text-2xl font-bold text-chart-4">{dashboard.employees.totalActive}</p>
						<p className="text-xs text-muted-foreground">{t("company.employees.active")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-1/15 flex items-center justify-center">
							<Clock className="h-4 w-4 text-chart-1" />
						</div>
						<p className="text-2xl font-bold text-chart-1">{dashboard.employees.totalOnLeave}</p>
						<p className="text-xs text-muted-foreground">{t("company.employees.onLeave")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
							<Users className="h-4 w-4 text-muted-foreground" />
						</div>
						<p className="text-2xl font-bold text-muted-foreground">{dashboard.employees.totalTerminated}</p>
						<p className="text-xs text-muted-foreground">{t("company.employees.terminated")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
							<Banknote className="h-4 w-4 text-chart-4" />
						</div>
						<p className="text-xl font-bold text-chart-4">{formatCurrency(Number(dashboard.employees.totalMonthlyCost))}</p>
						<p className="text-xs text-muted-foreground">{t("company.reports.totalLabor")}</p>
					</div>
				</div>
			</div>

			{/* Asset Overview */}
			<div className="bg-card border-2 rounded-2xl p-5">
				<div className="flex items-center gap-3 mb-5">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Package className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.reports.assetOverview")}
					</h3>
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
							<CheckCircle2 className="h-4 w-4 text-chart-4" />
						</div>
						<p className="text-2xl font-bold text-chart-4">{dashboard.assets.available}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.available")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
							<Package className="h-4 w-4 text-chart-4" />
						</div>
						<p className="text-2xl font-bold text-chart-4">{dashboard.assets.inUse}</p>
						<p className="text-xs text-muted-foreground">{t("company.dashboard.inUse")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
							<Banknote className="h-4 w-4 text-chart-4" />
						</div>
						<p className="text-xl font-bold text-chart-4">{formatCurrency(Number(dashboard.assets.totalValue))}</p>
						<p className="text-xs text-muted-foreground">{t("company.assets.totalValue")}</p>
					</div>
					<div className="text-center p-4 rounded-xl border-2">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-chart-1/15 flex items-center justify-center">
							<Wrench className="h-4 w-4 text-chart-1" />
						</div>
						<p className="text-xl font-bold text-chart-1">{formatCurrency(Number(dashboard.assets.totalMonthlyRent))}</p>
						<p className="text-xs text-muted-foreground">{t("company.assets.monthlyRent")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
