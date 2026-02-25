"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
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
import { EmployeesAnalyticsCard } from "./EmployeesAnalyticsCard";
import { ExpensesAnalyticsCard } from "./ExpensesAnalyticsCard";
import { AssetsAnalyticsCard } from "./AssetsAnalyticsCard";

interface CompanyDashboardProps {
	organizationId: string;
}

export function CompanyDashboard({ organizationId }: CompanyDashboardProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.company.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	if (isLoading) {
		return (
			<div className="space-y-6" dir="rtl">
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4"
						>
							<div className="h-20 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5"
						>
							<div className="h-[320px] animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!data) return null;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ar-SA", {
			style: "decimal",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount) + " ر.س";
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Statistics Cards - Glass Morphism */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{/* Total Salaries */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
							{data.employees.totalActive} {t("company.dashboard.activeEmployees")}
						</span>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.dashboard.totalSalaries")}
					</p>
					<p className="text-xl font-bold text-blue-700 dark:text-blue-300">
						{formatCurrency(data.employees.totalMonthlyCost)}
					</p>
				</div>

				{/* Total Expenses */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
							<Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
						</div>
						<span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
							{data.expenses.totalActiveExpenses} {t("company.dashboard.activeExpenses")}
						</span>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.dashboard.totalExpenses")}
					</p>
					<p className="text-xl font-bold text-orange-700 dark:text-orange-300">
						{formatCurrency(data.expenses.totalMonthlyAmount)}
					</p>
				</div>

				{/* Asset Value */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
							{data.assets.total} {t("company.dashboard.totalAssets")}
						</span>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.dashboard.assetValue")}
					</p>
					<p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
						{formatCurrency(data.assets.totalValue)}
					</p>
				</div>

				{/* Total Monthly Cost */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
							<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.dashboard.totalMonthlyCost")}
					</p>
					<p className="text-xl font-bold text-red-700 dark:text-red-300">
						{formatCurrency(data.totalMonthlyCost)}
					</p>
				</div>
			</div>

			{/* Alerts Section */}
			{(data.alerts.upcomingPayments > 0 || data.alerts.expiringInsurance > 0) && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{data.alerts.upcomingPayments > 0 && (
						<div className="backdrop-blur-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/30 rounded-2xl shadow-lg shadow-black/5 p-5">
							<div className="flex items-center gap-2 mb-3">
								<div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
									<AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
								</div>
								<h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300">
									{t("company.dashboard.upcomingPayments")} ({data.alerts.upcomingPayments})
								</h3>
							</div>
							<ul className="space-y-2">
								{data.alerts.upcomingPaymentsList.map((payment: { expense: { id: string; name: string }; dueDate: string }) => (
									<li key={payment.expense.id} className="flex justify-between text-sm">
										<span className="text-orange-800 dark:text-orange-200">{payment.expense.name}</span>
										<span className="text-orange-600/70 dark:text-orange-400/70 text-xs">
											{new Date(payment.dueDate).toLocaleDateString("ar-SA")}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{data.alerts.expiringInsurance > 0 && (
						<div className="backdrop-blur-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 rounded-2xl shadow-lg shadow-black/5 p-5">
							<div className="flex items-center gap-2 mb-3">
								<div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
									<Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
								</div>
								<h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
									{t("company.dashboard.expiringInsurance")} ({data.alerts.expiringInsurance})
								</h3>
							</div>
							<ul className="space-y-2">
								{data.alerts.expiringInsuranceList.map((asset: { id: string; name: string; insuranceExpiry: string }) => (
									<li key={asset.id} className="flex justify-between text-sm">
										<span className="text-red-800 dark:text-red-200">{asset.name}</span>
										<span className="text-red-600/70 dark:text-red-400/70 text-xs">
											{new Date(asset.insuranceExpiry).toLocaleDateString("ar-SA")}
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
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
				<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
					{t("company.dashboard.assetOverview")}
				</h3>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="text-center p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						</div>
						<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{data.assets.available}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.available")}</p>
					</div>
					<div className="text-center p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
							<Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.assets.inUse}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.inUse")}</p>
					</div>
					<div className="text-center p-3 rounded-xl bg-orange-50/80 dark:bg-orange-900/20 border border-orange-100/50 dark:border-orange-800/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
							<Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
						</div>
						<p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{data.assets.maintenance}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.maintenance")}</p>
					</div>
					<div className="text-center p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-700/30">
						<div className="mx-auto mb-2 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
							<Archive className="h-4 w-4 text-slate-500 dark:text-slate-400" />
						</div>
						<p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{data.assets.retired}</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.dashboard.retired")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
