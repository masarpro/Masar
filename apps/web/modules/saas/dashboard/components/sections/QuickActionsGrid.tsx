"use client";

import {
	Calculator,
	FilePlus2,
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
	];

	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
			{quickActions.map((action, i) => {
				const Icon = action.icon;
				return (
					<div
						key={i}
						className="overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-3"
						style={{ animationDelay: `${200 + i * 30}ms` }}
					>
						<Link
							href={action.browsePath}
							className={`flex flex-col items-center gap-1.5 border-b p-2.5 transition-colors ${action.bgColor} ${action.hoverBg} ${action.borderColor}`}
						>
							<div className={`rounded-lg bg-card/60 p-2 ${action.iconColor}`}>
								<Icon className="h-5 w-5" />
							</div>
							<span className="text-center text-xs font-medium text-foreground/80">
								{action.sectionLabel}
							</span>
						</Link>
						<Link
							href={action.createPath}
							className="flex items-center justify-center gap-1.5 bg-card/50 p-2 transition-colors hover:bg-card/80"
						>
							<Plus className={`h-3.5 w-3.5 ${action.iconColor}`} />
							<span className={`text-[10px] font-medium ${action.iconColor}`}>
								{action.actionLabel}
							</span>
						</Link>
					</div>
				);
			})}
		</div>
	);
}
