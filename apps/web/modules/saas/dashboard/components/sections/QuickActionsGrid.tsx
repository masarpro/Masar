"use client";

import { useState } from "react";
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
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { usePermission } from "@saas/permissions/hooks/use-permission";
import { AddExpenseDialog } from "@saas/finance/components/expenses/AddExpenseDialog";
import { AddPaymentDialog } from "@saas/finance/components/payments/AddPaymentDialog";

interface QuickActionsGridProps {
	organizationSlug: string;
}

/**
 * Botly-restyle: one flat strip of shortcut tiles under the hero —
 * bg-card + 2px Stroke border + Brand-tinted icon chips (no glass,
 * no pastel washes, no shadows). Tile body browses; the + creates.
 */
export function QuickActionsGrid({ organizationSlug }: QuickActionsGridProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { can, isOwner } = usePermission();
	const organizationId = activeOrganization?.id ?? "";
	const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

	// Each quick action requires the same permission as its target section
	const allowed = {
		expenses: isOwner || can("finance", "view"),
		payments: isOwner || can("finance", "payments"),
		quotations: isOwner || can("pricing", "quotations"),
		invoices: isOwner || can("finance", "invoices"),
		studies: isOwner || can("pricing", "studies"),
		leads: isOwner || can("pricing", "leads"),
	};

	const quickActions = [
		{
			icon: TrendingDown,
			visible: allowed.expenses,
			sectionLabel: t("dashboard.actions.expenses"),
			actionLabel: t("dashboard.actions.addExpense"),
			browsePath: `/app/${organizationSlug}/finance/expenses`,
			createPath: "",
			chip: "bg-destructive/15 text-destructive",
			onCreateClick: () => setExpenseDialogOpen(true),
		},
		{
			icon: TrendingUp,
			visible: allowed.payments,
			sectionLabel: t("dashboard.actions.payments"),
			actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`,
			createPath: "",
			chip: "bg-success/15 text-success",
			onCreateClick: () => setPaymentDialogOpen(true),
		},
		{
			icon: FileText,
			visible: allowed.quotations,
			sectionLabel: t("dashboard.actions.quotations"),
			actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`,
			createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			chip: "bg-chart-3/20 text-chart-3",
		},
		{
			icon: Receipt,
			visible: allowed.invoices,
			sectionLabel: t("dashboard.actions.invoices"),
			actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`,
			createPath: `/app/${organizationSlug}/finance/invoices/new`,
			chip: "bg-chart-4/15 text-chart-4",
		},
		{
			icon: Calculator,
			visible: allowed.studies,
			sectionLabel: t("dashboard.actions.quantityStudies"),
			actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/pricing/studies`,
			createPath: `/app/${organizationSlug}/pricing/studies?new=1`,
			chip: "bg-chart-1/25 text-foreground",
		},
		{
			icon: Users,
			visible: allowed.leads,
			sectionLabel: t("dashboard.actions.leads"),
			actionLabel: t("dashboard.actions.newLead"),
			browsePath: `/app/${organizationSlug}/pricing/leads`,
			createPath: `/app/${organizationSlug}/pricing/leads/new`,
			chip: "bg-primary/10 text-primary",
		},
	];

	const visibleActions = quickActions.filter((action) => action.visible);

	if (visibleActions.length === 0) {
		return null;
	}

	return (
		<>
			<div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
				{visibleActions.map((action, i) => {
					const Icon = action.icon;
					const createInner = (
						<>
							<Plus className="size-3.5" />
							<span className="truncate">{action.actionLabel}</span>
						</>
					);
					return (
						<div
							key={i}
							className="flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 bg-card transition-colors hover:border-primary/20"
						>
							<Link
								href={action.browsePath}
								className="flex min-w-0 items-center gap-2.5 p-3"
							>
								<span
									className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${action.chip}`}
								>
									<Icon className="size-4.5" />
								</span>
								<span className="truncate text-sm font-semibold text-card-foreground">
									{action.sectionLabel}
								</span>
							</Link>
							{action.onCreateClick ? (
								<button
									type="button"
									onClick={action.onCreateClick}
									className="flex items-center justify-center gap-1.5 border-t-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
								>
									{createInner}
								</button>
							) : (
								<Link
									href={action.createPath}
									className="flex items-center justify-center gap-1.5 border-t-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
								>
									{createInner}
								</Link>
							)}
						</div>
					);
				})}
			</div>

			<AddExpenseDialog
				open={expenseDialogOpen}
				onOpenChange={setExpenseDialogOpen}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
			/>

			<AddPaymentDialog
				open={paymentDialogOpen}
				onOpenChange={setPaymentDialogOpen}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
			/>
		</>
	);
}
