"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
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
		new Intl.NumberFormat("ar-SA").format(amount) + " ر.س";

	if (isLoading) {
		return (
			<div className="space-y-6" dir="rtl">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6"
					>
						<div className="h-32 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!dashboard) return null;

	return (
		<div className="space-y-6" dir="rtl">
			{/* Monthly Summary */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.reports.monthlySummary")}
					</h3>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.reports.costItem")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.reports.monthlyAmount")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.reports.annualAmount")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
							<TableCell className="font-medium text-slate-900 dark:text-slate-100">{t("company.reports.salariesAndAllowances")}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.employees.totalMonthlySalaries)}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.employees.totalMonthlySalaries * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
							<TableCell className="font-medium text-slate-900 dark:text-slate-100">{t("company.reports.gosiContributions")}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.employees.totalMonthlyGosi)}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.employees.totalMonthlyGosi * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
							<TableCell className="font-medium text-slate-900 dark:text-slate-100">{t("company.reports.recurringExpenses")}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.expenses.totalMonthlyAmount)}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.expenses.totalAnnualAmount)}</TableCell>
						</TableRow>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
							<TableCell className="font-medium text-slate-900 dark:text-slate-100">{t("company.reports.assetRentals")}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.assets.totalMonthlyRent)}</TableCell>
							<TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(dashboard.assets.totalMonthlyRent * 12)}</TableCell>
						</TableRow>
						<TableRow className="border-t-2 border-slate-200/50 dark:border-slate-600/50 hover:bg-transparent">
							<TableCell className="font-bold text-slate-900 dark:text-slate-100">{t("company.reports.totalOverhead")}</TableCell>
							<TableCell className="font-bold text-red-600 dark:text-red-400">{formatCurrency(dashboard.totalMonthlyCost)}</TableCell>
							<TableCell className="font-bold text-red-600 dark:text-red-400">{formatCurrency(dashboard.totalMonthlyCost * 12)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			{/* Expenses by Category */}
			{expenseSummary?.byCategory && (
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.reports.expensesByCategory")}
						</h3>
					</div>
					<Table>
						<TableHeader>
							<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
								<TableHead className="text-slate-500 dark:text-slate-400">{t("company.expenses.category")}</TableHead>
								<TableHead className="text-slate-500 dark:text-slate-400">{t("company.reports.monthlyAmount")}</TableHead>
								<TableHead className="text-slate-500 dark:text-slate-400">{t("company.reports.percentage")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{Object.entries(expenseSummary.byCategory)
								.sort(([, a], [, b]) => (b as number) - (a as number))
								.map(([category, amount]) => (
									<TableRow key={category} className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
										<TableCell className="text-slate-900 dark:text-slate-100">{t(`company.expenses.categories.${category}`)}</TableCell>
										<TableCell className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(amount as number)}</TableCell>
										<TableCell>
											<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
				<div className="flex items-center gap-3 mb-5">
					<div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
						<Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.reports.workforceSummary")}
					</h3>
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="text-center p-4 rounded-xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100/50 dark:border-teal-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
							<CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
						</div>
						<p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{dashboard.employees.totalActive}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.active")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
							<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
						</div>
						<p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{dashboard.employees.totalOnLeave}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.onLeave")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-700/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
							<Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
						</div>
						<p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{dashboard.employees.totalTerminated}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.employees.terminated")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(dashboard.employees.totalMonthlyCost)}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.reports.totalLabor")}</p>
					</div>
				</div>
			</div>

			{/* Asset Overview */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
				<div className="flex items-center gap-3 mb-5">
					<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
						<Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.reports.assetOverview")}
					</h3>
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="text-center p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						</div>
						<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{dashboard.assets.available}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.available")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboard.assets.inUse}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.inUse")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
							<Banknote className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
						</div>
						<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(dashboard.assets.totalValue)}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.totalValue")}</p>
					</div>
					<div className="text-center p-4 rounded-xl bg-orange-50/80 dark:bg-orange-900/20 border border-orange-100/50 dark:border-orange-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
							<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
						</div>
						<p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(dashboard.assets.totalMonthlyRent)}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.assets.monthlyRent")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
