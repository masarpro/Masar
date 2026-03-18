"use client";

import {
	Calculator,
	ClipboardList,
	FilePlus2,
	HardHat,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface QuickActionsGridProps {
	organizationSlug: string;
}

export function QuickActionsGrid({ organizationSlug }: QuickActionsGridProps) {
	const t = useTranslations();

	const quickActions = [
		{
			icon: TrendingDown,
			sectionLabel: t("dashboard.actions.expenses"),
			actionLabel: t("dashboard.actions.addExpense"),
			browsePath: `/app/${organizationSlug}/finance/expenses`,
			createPath: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-rose-500 dark:text-rose-400",
			bgColor: "bg-rose-50/80 dark:bg-rose-950/30",
			hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
			borderColor: "border-rose-200/50 dark:border-rose-800/50",
		},
		{
			icon: TrendingUp,
			sectionLabel: t("dashboard.actions.payments"),
			actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`,
			createPath: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-sky-500 dark:text-sky-400",
			bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
			hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
			borderColor: "border-sky-200/50 dark:border-sky-800/50",
		},
		{
			icon: Receipt,
			sectionLabel: t("dashboard.actions.invoices"),
			actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`,
			createPath: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-sky-500 dark:text-sky-400",
			bgColor: "bg-sky-50/80 dark:bg-sky-950/30",
			hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-900/50",
			borderColor: "border-sky-200/50 dark:border-sky-800/50",
		},
		{
			icon: FilePlus2,
			sectionLabel: t("dashboard.actions.pricing"),
			actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`,
			createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-violet-500 dark:text-violet-400",
			bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
			hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
			borderColor: "border-violet-200/50 dark:border-violet-800/50",
		},
		{
			icon: Calculator,
			sectionLabel: t("dashboard.actions.quantityStudies"),
			actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/quantities`,
			createPath: `/app/${organizationSlug}/quantities`,
			iconColor: "text-amber-500 dark:text-amber-400",
			bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
		},
		{
			icon: UserSearch,
			sectionLabel: t("dashboard.actions.leads"),
			actionLabel: t("dashboard.actions.newLead"),
			browsePath: `/app/${organizationSlug}/pricing/leads`,
			createPath: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-pink-500 dark:text-pink-400",
			bgColor: "bg-pink-50/80 dark:bg-pink-950/30",
			hoverBg: "hover:bg-pink-100 dark:hover:bg-pink-900/50",
			borderColor: "border-pink-200/50 dark:border-pink-800/50",
		},
		{
			icon: ClipboardList,
			sectionLabel: t("dashboard.actions.dailyReport"),
			actionLabel: t("dashboard.actions.dailyReport"),
			browsePath: `/app/${organizationSlug}/projects`,
			createPath: `/app/${organizationSlug}/projects`,
			iconColor: "text-cyan-500 dark:text-cyan-400",
			bgColor: "bg-cyan-50/80 dark:bg-cyan-950/30",
			hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-900/50",
			borderColor: "border-cyan-200/50 dark:border-cyan-800/50",
			singleSection: true,
		},
		{
			icon: HardHat,
			sectionLabel: t("dashboard.actions.manageCompany"),
			actionLabel: t("dashboard.actions.manageCompany"),
			browsePath: `/app/${organizationSlug}/company`,
			createPath: `/app/${organizationSlug}/company`,
			iconColor: "text-indigo-500 dark:text-indigo-400",
			bgColor: "bg-indigo-50/80 dark:bg-indigo-950/30",
			hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
			borderColor: "border-indigo-200/50 dark:border-indigo-800/50",
			singleSection: true,
		},
	];

	return (
		<div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
			{quickActions.map((action, i) => {
				const Icon = action.icon;
				const isSingleSection =
					"singleSection" in action && action.singleSection;
				if (isSingleSection) {
					return (
						<Link
							key={i}
							href={action.browsePath}
							className={`overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 flex flex-col items-center justify-center gap-2 p-4 ${action.bgColor} ${action.hoverBg}`}
							style={{ animationDelay: `${280 + i * 35}ms` }}
						>
							<div
								className={`rounded-xl bg-card/60 p-3 ${action.iconColor}`}
							>
								<Icon className="h-6 w-6" />
							</div>
							<span className="text-center text-sm font-medium text-foreground/80">
								{action.sectionLabel}
							</span>
						</Link>
					);
				}
				return (
					<div
						key={i}
						className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl animate-in fade-in slide-in-from-bottom-3"
						style={{ animationDelay: `${280 + i * 35}ms` }}
					>
						<Link
							href={action.browsePath}
							className={`flex flex-col items-center gap-2 border-b p-4 transition-colors ${action.bgColor} ${action.hoverBg} ${action.borderColor}`}
						>
							<div
								className={`rounded-xl bg-card/60 p-3 ${action.iconColor}`}
							>
								<Icon className="h-6 w-6" />
							</div>
							<span className="text-center text-sm font-medium text-foreground/80">
								{action.sectionLabel}
							</span>
						</Link>
						<Link
							href={action.createPath}
							className="flex items-center justify-center gap-2 bg-card/50 p-3 transition-colors hover:bg-card/80"
						>
							<Plus className={`h-4 w-4 ${action.iconColor}`} />
							<span className={`text-xs font-medium ${action.iconColor}`}>
								{action.actionLabel}
							</span>
						</Link>
					</div>
				);
			})}
		</div>
	);
}
