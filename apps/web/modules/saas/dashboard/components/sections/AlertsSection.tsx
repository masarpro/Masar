"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronLeft,
	Clock,
	FileWarning,
	Flag,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

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

type Severity = "danger" | "warning" | "info";

interface AlertItem {
	id: string;
	severity: Severity;
	title: string;
	description: string;
	date: Date | null;
	amount?: number;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const SEVERITY_ORDER: Record<Severity, number> = {
	danger: 0,
	warning: 1,
	info: 2,
};

const SEVERITY_STYLES: Record<
	Severity,
	{ icon: string; iconBg: string; label: string }
> = {
	danger: {
		icon: "text-red-600 dark:text-red-400",
		iconBg: "bg-red-100 dark:bg-red-950/40",
		label: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
	},
	warning: {
		icon: "text-orange-600 dark:text-orange-400",
		iconBg: "bg-orange-100 dark:bg-orange-950/40",
		label: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
	},
	info: {
		icon: "text-blue-600 dark:text-blue-400",
		iconBg: "bg-blue-100 dark:bg-blue-950/40",
		label: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
	},
};

function toDate(d: Date | string | null | undefined): Date | null {
	if (!d) return null;
	const date = new Date(d);
	return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(date: Date): number {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const MAX_VISIBLE = 5;

/**
 * قسم «يحتاج انتباهك» — تنبيهات تفصيلية قابلة للإجراء مرتبة حسب الخطورة:
 * أحمر (متأخر) ← برتقالي (متابعة قريباً) ← أزرق (معلوماتي).
 * تُعرض فقط البيانات المتوفرة فعلياً من الـ API — لا بيانات مُخترعة.
 */
export function AlertsSection({
	overdueInvoices,
	overdueMilestones,
	pendingSubcontractClaims,
	upcomingPayments,
	organizationSlug,
}: AlertsSectionProps) {
	const t = useTranslations();
	const locale = useLocale();

	const dateFmt = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
	});

	const items: AlertItem[] = [];

	// فواتير متأخرة — أحمر، مع المبلغ المتبقي وتاريخ الاستحقاق
	for (const inv of overdueInvoices) {
		const remaining = Number(inv.totalAmount) - Number(inv.paidAmount);
		const due = toDate(inv.dueDate);
		const overdueDays = due ? Math.abs(Math.min(diffDays(due), 0)) : null;
		items.push({
			id: `inv-${inv.id}`,
			severity: "danger",
			title: `${t("dashboard.alerts.overdueInvoiceItem")} #${inv.invoiceNo}`,
			description: [
				inv.clientName,
				overdueDays
					? t("dashboard.alerts.overdueBy", { days: overdueDays })
					: null,
			]
				.filter(Boolean)
				.join(" — "),
			date: due,
			amount: remaining > 0 ? remaining : undefined,
			href: `/app/${organizationSlug}/finance/invoices/${inv.id}`,
			icon: FileWarning,
		});
	}

	// مراحل متأخرة — أحمر، باسم المشروع
	for (const m of overdueMilestones) {
		const planned = toDate(m.plannedEnd);
		const overdueDays = planned
			? Math.abs(Math.min(diffDays(planned), 0))
			: null;
		items.push({
			id: `ms-${m.id}`,
			severity: "danger",
			title: m.title,
			description: [
				t("dashboard.alerts.inProject", { project: m.project.name }),
				overdueDays
					? t("dashboard.alerts.overdueBy", { days: overdueDays })
					: null,
			]
				.filter(Boolean)
				.join(" — "),
			date: planned,
			href: `/app/${organizationSlug}/projects/${m.project.id}`,
			icon: AlertTriangle,
		});
	}

	// مطالبات باطن معلّقة — برتقالي (العدد فقط متوفر من الـ API)
	if (pendingSubcontractClaims > 0) {
		items.push({
			id: "claims",
			severity: "warning",
			title: t("dashboard.alerts.pendingClaimsCount", {
				count: pendingSubcontractClaims,
			}),
			description: t("dashboard.alerts.claimsDesc"),
			date: null,
			href: `/app/${organizationSlug}/projects`,
			icon: Flag,
		});
	}

	// دفعات/مراحل مستحقة قريباً — أزرق معلوماتي
	for (const m of upcomingPayments) {
		const planned = toDate(m.plannedEnd);
		const inDays = planned ? Math.max(diffDays(planned), 0) : null;
		items.push({
			id: `up-${m.id}`,
			severity: "info",
			title: m.title,
			description: [
				t("dashboard.alerts.inProject", { project: m.project.name }),
				inDays !== null
					? inDays === 0
						? t("dashboard.alerts.dueToday")
						: t("dashboard.alerts.dueInDays", { days: inDays })
					: null,
			]
				.filter(Boolean)
				.join(" — "),
			date: planned,
			href: `/app/${organizationSlug}/projects/${m.project.id}`,
			icon: Clock,
		});
	}

	// ترتيب: الخطورة أولاً ثم الأقدم استحقاقاً
	items.sort((a, b) => {
		const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
		if (sev !== 0) return sev;
		const at = a.date?.getTime() ?? Number.POSITIVE_INFINITY;
		const bt = b.date?.getTime() ?? Number.POSITIVE_INFINITY;
		return at - bt;
	});

	// Empty state إيجابية — لا يُعرض القسم فارغاً
	if (items.length === 0) {
		return (
			<div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/30 shadow-lg shadow-black/5 flex items-center justify-center gap-3 p-4 text-center">
				<CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
				<p className="text-sm font-semibold text-foreground">
					{t("dashboard.alerts.empty")}
				</p>
			</div>
		);
	}

	const visibleItems = items.slice(0, MAX_VISIBLE);
	const hiddenCount = items.length - visibleItems.length;

	return (
		<section
			aria-label={t("dashboard.alerts.needsAttention")}
			className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5 flex flex-col p-3 sm:p-4"
		>
			<div className="flex items-center gap-2 mb-2">
				<div className="p-1.5 rounded-lg bg-amber-500/10">
					<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
				</div>
				<h2 className="text-sm sm:text-base font-bold text-foreground">
					{t("dashboard.alerts.needsAttention")}
				</h2>
				<span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full tabular-nums">
					{items.length}
				</span>
			</div>

			<ul className="flex flex-col divide-y divide-border/40">
				{visibleItems.map((item) => {
					const Icon = item.icon;
					const styles = SEVERITY_STYLES[item.severity];
					return (
						<li key={item.id}>
							<Link
								href={item.href}
								className="group flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<div
									className={`p-1.5 rounded-lg ${styles.iconBg} shrink-0`}
								>
									<Icon
										className={`h-4 w-4 ${styles.icon}`}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-foreground truncate">
										{item.title}
									</p>
									{item.description && (
										<p className="text-xs text-foreground/70 truncate">
											{item.description}
										</p>
									)}
								</div>
								{item.amount !== undefined && (
									<span className="hidden sm:inline-flex shrink-0 text-sm font-bold text-foreground tabular-nums">
										<Currency amount={item.amount} />
									</span>
								)}
								{item.date && (
									<span
										className={`hidden md:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles.label}`}
									>
										{t("dashboard.alerts.dueOn", {
											date: dateFmt.format(item.date),
										})}
									</span>
								)}
								<span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
									{t("dashboard.alerts.viewAction")}
									<ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
								</span>
							</Link>
						</li>
					);
				})}
			</ul>

			{hiddenCount > 0 && (
				<p className="mt-1.5 pt-1.5 border-t border-border/40 text-center text-xs text-foreground/70">
					{t("dashboard.alerts.moreAlerts", { count: hiddenCount })}
				</p>
			)}
		</section>
	);
}
