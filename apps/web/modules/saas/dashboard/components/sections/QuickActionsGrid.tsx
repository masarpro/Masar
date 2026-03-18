"use client";

import {
	Calculator,
	FileText,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-xl shadow-sm";

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
			iconColor: "text-red-600 dark:text-red-400",
		},
		{
			icon: TrendingUp,
			sectionLabel: t("dashboard.actions.payments"),
			actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`,
			createPath: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			icon: FileText,
			sectionLabel: t("dashboard.actions.quotations"),
			actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`,
			createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-blue-600 dark:text-blue-400",
		},
		{
			icon: Receipt,
			sectionLabel: t("dashboard.actions.invoices"),
			actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`,
			createPath: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-sky-600 dark:text-sky-400",
		},
		{
			icon: Calculator,
			sectionLabel: t("dashboard.actions.quantityStudies"),
			actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/pricing/studies`,
			createPath: `/app/${organizationSlug}/pricing/studies/new`,
			iconColor: "text-violet-600 dark:text-violet-400",
		},
		{
			icon: Users,
			sectionLabel: t("dashboard.actions.leads"),
			actionLabel: t("dashboard.actions.newLead"),
			browsePath: `/app/${organizationSlug}/pricing/leads`,
			createPath: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-orange-600 dark:text-orange-400",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
			{quickActions.map((action, i) => {
				const Icon = action.icon;
				return (
					<div
						key={i}
						className={`${glassCard} overflow-hidden transition-all duration-200 hover:shadow-md`}
					>
						<Link
							href={action.browsePath}
							className="flex flex-col items-center gap-2 border-b border-border/30 p-3 transition-colors hover:bg-muted/40"
						>
							<div className="rounded-lg bg-muted/60 p-2.5">
								<Icon className={`h-6 w-6 ${action.iconColor}`} />
							</div>
							<span className="text-center text-sm font-medium text-foreground/80">
								{action.sectionLabel}
							</span>
						</Link>
						<Link
							href={action.createPath}
							className="flex items-center justify-center gap-2 p-2.5 transition-colors hover:bg-muted/40"
						>
							<Plus className={`h-4 w-4 ${action.iconColor}`} />
							<span
								className={`text-xs font-medium ${action.iconColor}`}
							>
								{action.actionLabel}
							</span>
						</Link>
					</div>
				);
			})}
		</div>
	);
}
