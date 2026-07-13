"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Receipt,
	TrendingDown,
	TrendingUp,
	Plus,
} from "lucide-react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { AddExpenseDialog } from "@saas/finance/components/expenses/AddExpenseDialog";
import { AddPaymentDialog } from "@saas/finance/components/payments/AddPaymentDialog";

interface ActionCardsProps {
	organizationSlug: string;
}

interface MainSection {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	browsePath: string;
	createPath: string;
	iconColor: string;
	bgColor: string;
	hoverBg: string;
	borderColor: string;
}

export function ActionCards({ organizationSlug }: ActionCardsProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

	// Main 3 sections with cards
	const mainSections: MainSection[] = [
		{
			id: "invoices",
			icon: Receipt,
			browsePath: `${basePath}/invoices`,
			createPath: `${basePath}/invoices/new`,
			iconColor: "text-chart-4 dark:text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			hoverBg: "hover:bg-chart-4/15 dark:hover:bg-chart-4/20",
			borderColor: "border-chart-4/50 dark:border-chart-4/50",
		},
		{
			id: "expenses",
			icon: TrendingDown,
			browsePath: `${basePath}/expenses`,
			createPath: `${basePath}/expenses/new`,
			iconColor: "text-destructive",
			bgColor: "bg-destructive/15",
			hoverBg: "hover:bg-destructive/15",
			borderColor: "border-destructive/30",
		},
		{
			id: "payments",
			icon: TrendingUp,
			browsePath: `${basePath}/payments`,
			createPath: `${basePath}/payments/new`,
			iconColor: "text-chart-4 dark:text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			hoverBg: "hover:bg-chart-4/15 dark:hover:bg-chart-4/20",
			borderColor: "border-chart-4/50 dark:border-chart-4/50",
		},
	];

	return (
		<>
			{/* الجوال: صفوف مضغوطة (أيقونة + عنوان) */}
			<div className="flex flex-col gap-2 sm:hidden">
				{mainSections.map((section) => {
					const Icon = section.icon;
					const isExpense = section.id === "expenses";
					const isPayment = section.id === "payments";
					return (
						<div
							key={section.id}
							className={`flex h-14 items-center gap-3 rounded-2xl border ${section.borderColor} ${section.bgColor} px-3`}
						>
							<Link
								href={section.browsePath}
								className="flex min-w-0 flex-1 items-center gap-3"
							>
								<div
									className={`shrink-0 rounded-lg bg-card p-2 ${section.iconColor}`}
								>
									<Icon className="h-5 w-5" />
								</div>
								<span className="truncate text-sm font-medium text-foreground/80">
									{t(`finance.dashboard.nav.${section.id}`)}
								</span>
							</Link>
							{isExpense || isPayment ? (
								<button
									type="button"
									aria-label={t(`finance.dashboard.nav.${section.id}New`)}
									onClick={() =>
										isExpense
											? setExpenseDialogOpen(true)
											: setPaymentDialogOpen(true)
									}
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card ${section.iconColor}`}
								>
									<Plus className="h-4 w-4" />
								</button>
							) : (
								<Link
									href={section.createPath}
									aria-label={t(`finance.dashboard.nav.${section.id}New`)}
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card ${section.iconColor}`}
								>
									<Plus className="h-4 w-4" />
								</Link>
							)}
						</div>
					);
				})}
			</div>

			{/* الديسكتوب كما هو */}
			<div className="hidden sm:grid sm:grid-cols-3 gap-4">
				{mainSections.map((section) => {
					const Icon = section.icon;
					const isExpense = section.id === "expenses";
						const isPayment = section.id === "payments";
					return (
						<div
							key={section.id}
							className="bg-card border-2 rounded-2xl overflow-hidden transition-colors"
						>
							{/* Browse Section (Top) */}
							<Link
								href={section.browsePath}
								className={`flex flex-col items-center gap-2 p-4 ${section.bgColor} ${section.hoverBg} transition-colors border-b ${section.borderColor}`}
							>
								<div
									className={`p-3 rounded-xl bg-card ${section.iconColor}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<span className="text-sm font-medium text-foreground/80 text-center">
									{t(`finance.dashboard.nav.${section.id}`)}
								</span>
							</Link>

							{/* Create Section (Bottom) — expense/payment open dialogs, others navigate */}
							{isExpense || isPayment ? (
								<button
									type="button"
									onClick={() =>
										isExpense
											? setExpenseDialogOpen(true)
											: setPaymentDialogOpen(true)
									}
									className="flex w-full items-center justify-center gap-2 p-3 bg-card hover:bg-accent transition-colors"
								>
									<Plus className={`h-4 w-4 ${section.iconColor}`} />
									<span className={`text-xs font-medium ${section.iconColor}`}>
										{t(`finance.dashboard.nav.${section.id}New`)}
									</span>
								</button>
							) : (
								<Link
									href={section.createPath}
									className="flex items-center justify-center gap-2 p-3 bg-card hover:bg-accent transition-colors"
								>
									<Plus className={`h-4 w-4 ${section.iconColor}`} />
									<span className={`text-xs font-medium ${section.iconColor}`}>
										{t(`finance.dashboard.nav.${section.id}New`)}
									</span>
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
