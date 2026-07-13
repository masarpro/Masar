"use client";

import { useState } from "react";
import {
	Landmark,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { AddExpenseDialog } from "@saas/finance/components/expenses/AddExpenseDialog";
import { AddPaymentDialog } from "@saas/finance/components/payments/AddPaymentDialog";

interface FinanceShortcutsCardProps {
	organizationSlug: string;
}

/**
 * Botly-style shortcuts card (same tile language as the home dashboard's
 * QuickActionsGrid): a single flat card with one row per section — icon chip +
 * label (browse) and a trailing "+" (create). Sits beside the recent-documents
 * table on the finance overview. Expenses/payments open the shared dialogs;
 * the rest navigate to verified /new routes.
 */
export function FinanceShortcutsCard({
	organizationSlug,
}: FinanceShortcutsCardProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const basePath = `/app/${organizationSlug}/finance`;
	const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

	const shortcuts: Array<{
		key: string;
		icon: LucideIcon;
		label: string;
		createLabel: string;
		browsePath: string;
		createPath?: string;
		onCreateClick?: () => void;
		chip: string;
	}> = [
		{
			key: "invoices",
			icon: Receipt,
			label: t("finance.dashboard.nav.invoices"),
			createLabel: t("finance.dashboard.nav.invoicesNew"),
			browsePath: `${basePath}/invoices`,
			createPath: `${basePath}/invoices/new`,
			chip: "bg-chart-4/15 text-chart-4",
		},
		{
			key: "expenses",
			icon: TrendingDown,
			label: t("finance.dashboard.nav.expenses"),
			createLabel: t("finance.dashboard.nav.expensesNew"),
			browsePath: `${basePath}/expenses`,
			onCreateClick: () => setExpenseDialogOpen(true),
			chip: "bg-destructive/15 text-destructive",
		},
		{
			key: "payments",
			icon: TrendingUp,
			label: t("finance.dashboard.nav.payments"),
			createLabel: t("finance.dashboard.nav.paymentsNew"),
			browsePath: `${basePath}/payments`,
			onCreateClick: () => setPaymentDialogOpen(true),
			chip: "bg-success/15 text-success",
		},
		{
			key: "clients",
			icon: Users,
			label: t("finance.dashboard.nav.clients"),
			createLabel: t("finance.dashboard.nav.clientsNew"),
			browsePath: `${basePath}/clients`,
			createPath: `${basePath}/clients/new`,
			chip: "bg-primary/10 text-primary",
		},
		{
			key: "banks",
			icon: Landmark,
			label: t("finance.dashboard.nav.banks"),
			createLabel: t("finance.dashboard.nav.banksNew"),
			browsePath: `${basePath}/banks`,
			createPath: `${basePath}/banks/new`,
			chip: "bg-chart-3/20 text-chart-3",
		},
	];

	const createChip =
		"flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground";

	return (
		<>
			<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
				<p className="mb-3 shrink-0 text-base font-semibold text-card-foreground">
					{t("dashboard.quickActions")}
				</p>

				<div className="flex min-h-0 flex-1 flex-col gap-2">
					{shortcuts.map((s) => {
						const Icon = s.icon;
						return (
							<div
								key={s.key}
								className="flex min-h-0 flex-1 items-center gap-2 rounded-2xl border-2 p-2 transition-colors hover:border-primary/20"
							>
								<Link
									href={s.browsePath}
									className="flex min-w-0 flex-1 items-center gap-2.5"
									title={s.label}
								>
									<span
										className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${s.chip}`}
									>
										<Icon className="size-4.5" />
									</span>
									<span className="truncate text-sm font-semibold text-card-foreground">
										{s.label}
									</span>
								</Link>
								{s.onCreateClick ? (
									<button
										type="button"
										onClick={s.onCreateClick}
										className={createChip}
										aria-label={s.createLabel}
										title={s.createLabel}
									>
										<Plus className="size-4" />
									</button>
								) : (
									<Link
										href={s.createPath ?? s.browsePath}
										className={createChip}
										aria-label={s.createLabel}
										title={s.createLabel}
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
		</>
	);
}
