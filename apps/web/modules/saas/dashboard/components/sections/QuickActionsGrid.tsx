"use client";

import { useState } from "react";
import {
	Calculator,
	ClipboardList,
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
import { SelectProjectDialog } from "./SelectProjectDialog";

interface QuickActionsGridProps {
	organizationSlug: string;
}

/**
 * Botly-restyle: all shortcuts merged into ONE flat card ("إجراءات سريعة").
 * Each cell is a section (icon chip + label → browse) with a trailing +
 * (create). Same surface/border/chip language as before — only the layout
 * changed from six separate tiles to a single grouped card.
 */
export function QuickActionsGrid({ organizationSlug }: QuickActionsGridProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { can, isOwner } = usePermission();
	const organizationId = activeOrganization?.id ?? "";
	const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	// Daily-report shortcut needs a project context — the dialog picks one,
	// then routes to that project's reports hub / new-report form.
	const [reportPickerTarget, setReportPickerTarget] = useState<string | null>(
		null,
	);

	// Each quick action requires the same permission as its target section
	const allowed = {
		expenses: isOwner || can("finance", "view"),
		payments: isOwner || can("finance", "payments"),
		quotations: isOwner || can("pricing", "quotations"),
		invoices: isOwner || can("finance", "invoices"),
		studies: isOwner || can("pricing", "studies"),
		leads: isOwner || can("pricing", "leads"),
		// Field supervisors carry reports.create without projects.edit — the
		// daily report is their core action, so either permission qualifies.
		dailyReports:
			isOwner || can("reports", "create") || can("projects", "edit"),
	};

	const quickActions = [
		{
			icon: ClipboardList,
			visible: allowed.dailyReports,
			sectionLabel: t("dashboard.actions.dailyReports"),
			actionLabel: t("dashboard.actions.newDailyReport"),
			browsePath: "",
			createPath: "",
			chip: "bg-chart-4/15 text-chart-4",
			onBrowseClick: () => setReportPickerTarget("execution/reports"),
			onCreateClick: () => setReportPickerTarget("execution/new-report"),
		},
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
			<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
				<p className="mb-3 shrink-0 text-base font-semibold text-card-foreground">
					{t("dashboard.quickActions")}
				</p>

				<div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-3">
					{visibleActions.map((action, i) => {
						const Icon = action.icon;
						const createChip = "flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground";
						return (
							<div
								key={i}
								className="flex min-h-0 min-w-0 items-center gap-2 rounded-2xl border-2 p-2 transition-colors hover:border-primary/20"
							>
								{action.onBrowseClick ? (
									<button
										type="button"
										onClick={action.onBrowseClick}
										className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
										title={action.sectionLabel}
									>
										<span
											className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${action.chip}`}
										>
											<Icon className="size-4" />
										</span>
										<span className="truncate text-sm font-semibold text-card-foreground">
											{action.sectionLabel}
										</span>
									</button>
								) : (
									<Link
										href={action.browsePath}
										className="flex min-w-0 flex-1 items-center gap-2.5"
										title={action.sectionLabel}
									>
										<span
											className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${action.chip}`}
										>
											<Icon className="size-4" />
										</span>
										<span className="truncate text-sm font-semibold text-card-foreground">
											{action.sectionLabel}
										</span>
									</Link>
								)}
								{action.onCreateClick ? (
									<button
										type="button"
										onClick={action.onCreateClick}
										className={createChip}
										aria-label={action.actionLabel}
										title={action.actionLabel}
									>
										<Plus className="size-4" />
									</button>
								) : (
									<Link
										href={action.createPath}
										className={createChip}
										aria-label={action.actionLabel}
										title={action.actionLabel}
									>
										<Plus className="size-4" />
									</Link>
								)}
							</div>
						);
					})}
				</div>
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

			<SelectProjectDialog
				open={reportPickerTarget !== null}
				onOpenChange={(open) => {
					if (!open) setReportPickerTarget(null);
				}}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				targetPath={reportPickerTarget ?? "execution/reports"}
			/>
		</>
	);
}
