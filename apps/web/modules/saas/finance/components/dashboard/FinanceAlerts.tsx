"use client";

import { AlertTriangle, Clock, ArrowUpRight, Bell } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDateArabic } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface OverdueInvoice {
	id: string;
	invoiceNo: string;
	clientName: string;
	totalAmount: number;
	paidAmount: number;
	dueDate: string | Date;
}

interface UpcomingDeadline {
	id: string;
	type: "invoice";
	documentNo: string;
	clientName: string;
	dueDate: string | Date;
}

interface FinanceAlertsProps {
	overdueInvoices: OverdueInvoice[];
	upcomingDeadlines?: UpcomingDeadline[];
	organizationSlug: string;
}

export function FinanceAlerts({
	overdueInvoices,
	upcomingDeadlines = [],
	organizationSlug,
}: FinanceAlertsProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	// Mock upcoming deadlines if none provided
	// TODO: Connect to real API
	const mockUpcomingDeadlines: UpcomingDeadline[] = upcomingDeadlines.length
		? upcomingDeadlines
		: [
				{
					id: "2",
					type: "invoice",
					documentNo: "INV-2024-015",
					clientName: "مؤسسة البناء",
					dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
				},
			];

	const hasOverdue = overdueInvoices.length > 0;
	const hasUpcoming = mockUpcomingDeadlines.length > 0;

	if (!hasOverdue && !hasUpcoming) {
		return (
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
				<div className="flex flex-col items-center justify-center text-center py-8">
					<div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
						<Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
						{t("finance.dashboard.alerts.allClear")}
					</h3>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{t("finance.dashboard.alerts.noAlerts")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Overdue Invoices Alert */}
			{hasOverdue && (
				<div className="backdrop-blur-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 rounded-2xl shadow-lg shadow-black/5 p-5">
					<div className="flex items-center gap-2 mb-4">
						<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
						<h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
							{t("finance.overdueAlert.title")}
						</h3>
						<span className="ms-auto text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
							{overdueInvoices.length}
						</span>
					</div>

					<div className="space-y-2">
						{overdueInvoices.slice(0, 3).map((invoice) => (
							<Link
								key={invoice.id}
								href={`${basePath}/invoices/${invoice.id}`}
								className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-red-100/50 dark:border-red-900/30"
							>
								<div>
									<p className="font-medium text-sm text-slate-900 dark:text-slate-100">
										{invoice.invoiceNo}
									</p>
									<p className="text-xs text-slate-600 dark:text-slate-400">
										{invoice.clientName}
									</p>
								</div>
								<div className="text-end">
									<p className="font-semibold text-sm text-red-600 dark:text-red-400">
										<Currency amount={invoice.totalAmount - invoice.paidAmount} />
									</p>
									<p className="text-xs text-slate-500">
										{formatDateArabic(invoice.dueDate)}
									</p>
								</div>
							</Link>
						))}
					</div>

					{overdueInvoices.length > 3 && (
						<Link
							href={`${basePath}/invoices?overdue=true`}
							className="mt-3 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
						>
							{t("finance.overdueAlert.viewAll")}
							<ArrowUpRight className="h-3 w-3" />
						</Link>
					)}
				</div>
			)}

			{/* Upcoming Deadlines Alert */}
			{hasUpcoming && (
				<div className="backdrop-blur-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-2xl shadow-lg shadow-black/5 p-5">
					<div className="flex items-center gap-2 mb-4">
						<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						<h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
							{t("finance.dashboard.alerts.upcomingDeadlines")}
						</h3>
						<span className="ms-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
							{mockUpcomingDeadlines.length}
						</span>
					</div>

					<div className="space-y-2">
						{mockUpcomingDeadlines.slice(0, 3).map((deadline) => {
							const path = `${basePath}/invoices/${deadline.id}`;
							const daysUntil = Math.ceil(
								(new Date(deadline.dueDate).getTime() - Date.now()) /
									(1000 * 60 * 60 * 24),
							);

							return (
								<Link
									key={`${deadline.type}-${deadline.id}`}
									href={path}
									className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-amber-100/50 dark:border-amber-900/30"
								>
									<div>
										<p className="font-medium text-sm text-slate-900 dark:text-slate-100">
											{deadline.documentNo}
										</p>
										<p className="text-xs text-slate-600 dark:text-slate-400">
											{deadline.clientName}
										</p>
									</div>
									<div className="text-end">
										<p className="font-semibold text-sm text-amber-600 dark:text-amber-400">
											{daysUntil} {t("common.days")}
										</p>
										<p className="text-xs text-slate-500">
											{t(`finance.dashboard.types.${deadline.type}`)}
										</p>
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			)}

			{/* Quick Tip */}
			<div className="backdrop-blur-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-start gap-3">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
						<Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">
							{t("finance.dashboard.alerts.tipTitle")}
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							{t("finance.dashboard.alerts.tipContent")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
