"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	CalendarClock,
	FileText,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Botly-style combined card: "needs attention" counters on top +
 * latest documents below, separated by a 2px Stroke divider — replaces
 * the two old glass cards (AlertsSection + RecentDocumentsCard) with a
 * single flat surface matching the dashboard grid.
 */
export function AttentionCard({
	organizationId,
	organizationSlug,
	overdueInvoices,
	overdueMilestones,
	pendingSubcontractClaims,
	upcomingPayments,
}: {
	organizationId: string;
	organizationSlug: string;
	overdueInvoices: unknown[];
	overdueMilestones: unknown[];
	pendingSubcontractClaims: number;
	upcomingPayments: unknown[];
}) {
	const t = useTranslations();

	const { data: invoicesData } = useQuery({
		...orpc.finance.invoices.list.queryOptions({
			input: { organizationId, limit: 3 },
		}),
		enabled: !!organizationId,
	});

	const attention = [
		{
			label: t("dashboard.alerts.overdueInvoices"),
			count: overdueInvoices.length,
			chip: "bg-destructive/15 text-destructive",
			icon: AlertTriangle,
			href: `/app/${organizationSlug}/finance/invoices`,
		},
		{
			label: t("dashboard.alerts.upcomingPayments"),
			count: upcomingPayments.length,
			chip: "bg-chart-1/25 text-foreground",
			icon: CalendarClock,
			href: `/app/${organizationSlug}/finance/payments`,
		},
		{
			label: t("dashboard.alerts.pendingClaims"),
			count: pendingSubcontractClaims,
			chip: "bg-chart-3/20 text-chart-3",
			icon: FileText,
			href: `/app/${organizationSlug}/projects`,
		},
		{
			label: t("dashboard.alerts.overdueMilestones"),
			count: overdueMilestones.length,
			chip: "bg-chart-4/15 text-chart-4",
			icon: CalendarClock,
			href: `/app/${organizationSlug}/projects`,
		},
	].filter((a) => a.count > 0);

	const recentInvoices = (invoicesData?.invoices ?? []).slice(0, 3) as Array<{
		id: string;
		invoiceNo?: string | number;
		createdAt?: string | Date;
	}>;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border-2 bg-card p-5">
			<p className="shrink-0 text-base font-semibold text-card-foreground">
				{t("dashboard.alerts.needsAttention")}
			</p>

			<div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
				{attention.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("dashboard.welcome.allGood")}
					</p>
				) : (
					attention.map((a) => {
						const Icon = a.icon;
						return (
							<Link
								key={a.label}
								href={a.href}
								className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-accent/50"
							>
								<span
									className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${a.chip}`}
								>
									<Icon className="size-4" />
								</span>
								<span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
									{a.label}
								</span>
								<span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary-foreground">
									{a.count}
								</span>
							</Link>
						);
					})
				)}
			</div>

			{recentInvoices.length > 0 && (
				<div className="mt-3 shrink-0 border-t-2 pt-3">
					<p className="text-sm font-semibold text-muted-foreground">
						{t("dashboard.recentDocs.title")}
					</p>
					<div className="mt-2 space-y-1.5">
						{recentInvoices.map((inv) => (
							<Link
								key={inv.id}
								href={`/app/${organizationSlug}/finance/invoices/${inv.id}`}
								className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-accent/50"
							>
								<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-chart-4/15 text-chart-4">
									<Receipt className="size-3.5" />
								</span>
								<span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
									{t("dashboard.recentDocs.invoice")} #{String(inv.invoiceNo ?? "")}
								</span>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
