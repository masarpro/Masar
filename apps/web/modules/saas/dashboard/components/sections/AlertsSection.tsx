"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	FileWarning,
	Flag,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

interface OverdueInvoice {
	id: string;
	invoiceNo: string;
	clientName: string;
	totalAmount: number | { toString(): string };
	paidAmount: number | { toString(): string };
	dueDate: Date | string;
	status: string;
}

interface OverdueMilestone {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	status: string;
	progress: number | { toString(): string };
	project: { id: string; name: string };
}

interface AlertsSectionProps {
	overdueInvoices: OverdueInvoice[];
	overdueMilestones: OverdueMilestone[];
	pendingSubcontractClaims: number;
	upcomingPayments: OverdueMilestone[];
	organizationSlug: string;
}

export function AlertsSection({
	overdueInvoices,
	overdueMilestones,
	pendingSubcontractClaims,
	upcomingPayments,
	organizationSlug,
}: AlertsSectionProps) {
	const t = useTranslations();

	const hasAlerts =
		overdueInvoices.length > 0 ||
		overdueMilestones.length > 0 ||
		pendingSubcontractClaims > 0 ||
		upcomingPayments.length > 0;

	// "All good" state
	if (!hasAlerts) {
		return (
			<div
				className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20 shadow-lg shadow-black/5 flex flex-col items-center justify-center p-2.5 text-center flex-1"
			>
				<CheckCircle2 className="h-7 w-7 text-emerald-500 mb-1" />
				<p className="text-sm font-semibold text-foreground">
					{t("dashboard.welcome.allGood")}
				</p>
				<p className="text-[11px] text-muted-foreground mt-0.5">
					{t("dashboard.alerts.needsAttention")}
				</p>
			</div>
		);
	}

	const sumOverdueInvoices = overdueInvoices.reduce(
		(sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
		0,
	);

	const alerts = [
		overdueInvoices.length > 0 && {
			title: t("dashboard.alerts.overdueInvoices"),
			count: overdueInvoices.length,
			amount: sumOverdueInvoices,
			icon: FileWarning,
			color: "text-red-600 dark:text-red-400",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			href: `/app/${organizationSlug}/finance/invoices?status=OVERDUE`,
		},
		overdueMilestones.length > 0 && {
			title: t("dashboard.alerts.overdueMilestones"),
			count: overdueMilestones.length,
			icon: AlertTriangle,
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-50 dark:bg-amber-950/20",
			href: `/app/${organizationSlug}/projects`,
		},
		pendingSubcontractClaims > 0 && {
			title: t("dashboard.alerts.pendingClaims"),
			count: pendingSubcontractClaims,
			icon: Flag,
			color: "text-orange-600 dark:text-orange-400",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			href: `/app/${organizationSlug}/projects`,
		},
		upcomingPayments.length > 0 && {
			title: t("dashboard.alerts.upcomingPayments"),
			count: upcomingPayments.length,
			icon: Clock,
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			href: `/app/${organizationSlug}/projects`,
		},
	].filter(Boolean) as Array<{
		title: string;
		count: number;
		amount?: number;
		icon: React.ComponentType<{ className?: string }>;
		color: string;
		bgColor: string;
		href: string;
	}>;

	const visibleAlerts = alerts.slice(0, 2);

	return (
		<div className="rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20 shadow-lg shadow-black/5 flex flex-col p-2.5 flex-1">
			<h3 className="text-xs font-bold text-foreground mb-1.5">
				{t("dashboard.alerts.needsAttention")}
			</h3>
			<div className="flex-1 space-y-1">
				{visibleAlerts.map((alert, i) => {
					const Icon = alert.icon;
					return (
						<Link
							key={i}
							href={alert.href}
							className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
						>
							<div className={`p-1 rounded-md ${alert.bgColor} shrink-0`}>
								<Icon className={`h-3.5 w-3.5 ${alert.color}`} />
							</div>
							<p className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
								{alert.title}
							</p>
							<span className={`text-lg font-bold ${alert.color} shrink-0`}>
								{alert.count}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
