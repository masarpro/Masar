"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	AlertTriangle,
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

function daysSince(date: Date | string): number {
	const now = new Date();
	const d = new Date(date);
	return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function daysUntil(date: Date | string | null): number {
	if (!date) return 0;
	const now = new Date();
	const d = new Date(date);
	return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
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

	if (!hasAlerts) return null;

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
			borderColor: "border-red-200/50 dark:border-red-800/50",
			href: `/app/${organizationSlug}/finance/invoices?status=OVERDUE`,
			items: overdueInvoices.slice(0, 3).map((inv) => ({
				label: `${inv.invoiceNo} — ${inv.clientName}`,
				value: Number(inv.totalAmount) - Number(inv.paidAmount),
				detail: `${daysSince(inv.dueDate)} ${t("dashboard.alerts.daysOverdue")}`,
			})),
		},
		overdueMilestones.length > 0 && {
			title: t("dashboard.alerts.overdueMilestones"),
			count: overdueMilestones.length,
			icon: AlertTriangle,
			color: "text-amber-600 dark:text-amber-400",
			bgColor: "bg-amber-50 dark:bg-amber-950/20",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
			href: `/app/${organizationSlug}/projects`,
			items: overdueMilestones.slice(0, 3).map((m) => ({
				label: `${m.project.name} — ${m.title}`,
				detail: m.plannedEnd
					? `${daysSince(m.plannedEnd)} ${t("dashboard.alerts.daysOverdue")}`
					: "",
			})),
		},
		pendingSubcontractClaims > 0 && {
			title: t("dashboard.alerts.pendingClaims"),
			count: pendingSubcontractClaims,
			icon: Flag,
			color: "text-orange-600 dark:text-orange-400",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			borderColor: "border-orange-200/50 dark:border-orange-800/50",
			href: `/app/${organizationSlug}/projects`,
		},
		upcomingPayments.length > 0 && {
			title: t("dashboard.alerts.upcomingPayments"),
			count: upcomingPayments.length,
			icon: Clock,
			color: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			borderColor: "border-blue-200/50 dark:border-blue-800/50",
			href: `/app/${organizationSlug}/projects`,
			items: upcomingPayments.slice(0, 3).map((m) => ({
				label: `${m.project.name} — ${m.title}`,
				detail: m.plannedEnd
					? `${daysUntil(m.plannedEnd)} ${t("dashboard.alerts.daysRemaining")}`
					: "",
			})),
		},
	].filter(Boolean) as Array<{
		title: string;
		count: number;
		amount?: number;
		icon: React.ComponentType<{ className?: string }>;
		color: string;
		bgColor: string;
		borderColor: string;
		href: string;
		items?: Array<{ label: string; value?: number; detail: string }>;
	}>;

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-foreground">
				{t("dashboard.alerts.needsAttention")}
			</h3>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{alerts.map((alert, i) => {
					const Icon = alert.icon;
					return (
						<Link
							key={i}
							href={alert.href}
							className={`${glassCard} border ${alert.borderColor} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500`}
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<div className="flex items-center justify-between mb-2">
								<div className={`p-1.5 rounded-lg ${alert.bgColor}`}>
									<Icon className={`h-4 w-4 ${alert.color}`} />
								</div>
								<span className={`text-lg font-bold ${alert.color}`}>
									{alert.count}
								</span>
							</div>
							<p className="text-xs font-medium text-foreground mb-1">
								{alert.title}
							</p>
							{alert.amount != null && alert.amount > 0 && (
								<p className={`text-sm font-bold ${alert.color}`}>
									<Currency amount={alert.amount} />
								</p>
							)}
							{alert.items && alert.items.length > 0 && (
								<div className="mt-2 space-y-1">
									{alert.items.map((item, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between text-[10px] text-muted-foreground"
										>
											<span className="truncate max-w-[60%]">
												{item.label}
											</span>
											<span className="text-[9px]">{item.detail}</span>
										</div>
									))}
								</div>
							)}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
