"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { StatusChip } from "@ui/components/status-chip";
import { Calculator, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface RecentDocumentsCardProps {
	organizationId: string;
	organizationSlug: string;
}

interface RecentDoc {
	id: string;
	type: "invoice" | "quotation" | "study";
	name: string;
	createdAt: Date | string;
	href: string;
	icon: typeof Receipt;
	iconColor: string;
	bgColor: string;
	/** حالة المستند — تُعرض فقط إن توفرت من الـ API ولها ترجمة */
	status?: string;
	statusLabelKey?: string;
	/** المبلغ — يُعرض فقط إن توفر من الـ API */
	amount?: number;
}

export function RecentDocumentsCard({
	organizationId,
	organizationSlug,
}: RecentDocumentsCardProps) {
	const t = useTranslations("dashboard");
	const tAll = useTranslations();
	const locale = useLocale();

	const { data: invoicesData } = useQuery({
		...orpc.finance.invoices.list.queryOptions({
			input: { organizationId, limit: 3 },
		}),
		enabled: !!organizationId,
	});

	const { data: quotationsData } = useQuery({
		...orpc.pricing.quotations.list.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const { data: studiesData } = useQuery({
		...orpc.pricing.studies.list.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const basePath = `/app/${organizationSlug}`;
	const recentDocs: RecentDoc[] = [];

	const toAmount = (v: unknown): number | undefined => {
		const n = Number(v);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	};

	for (const inv of (invoicesData?.invoices ?? []).slice(0, 3)) {
		const status = (inv as any).status as string | undefined;
		recentDocs.push({
			id: inv.id,
			type: "invoice",
			name: `${t("recentDocs.invoice")} #${(inv as any).invoiceNo}`,
			createdAt: (inv as any).createdAt,
			href: `${basePath}/finance/invoices/${inv.id}`,
			icon: Receipt,
			iconColor: "text-sky-600 dark:text-sky-400",
			bgColor: "bg-sky-50 dark:bg-sky-950/20",
			status,
			statusLabelKey: status
				? `finance.invoices.status.${status.toLowerCase()}`
				: undefined,
			amount: toAmount((inv as any).totalAmount),
		});
	}

	for (const q of (quotationsData?.quotations ?? []).slice(0, 3)) {
		const status = (q as any).status as string | undefined;
		recentDocs.push({
			id: q.id,
			type: "quotation",
			name: `${t("recentDocs.quotation")} #${(q as any).quotationNo}`,
			createdAt: (q as any).createdAt,
			href: `${basePath}/pricing/quotations/${q.id}`,
			icon: FileText,
			iconColor: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-50 dark:bg-blue-950/20",
			status,
			statusLabelKey: status
				? `pricing.quotations.status.${status.toLowerCase()}`
				: undefined,
			amount: toAmount((q as any).totalAmount),
		});
	}

	for (const s of (studiesData?.costStudies ?? []).slice(0, 3)) {
		const status = (s as any).status as string | undefined;
		recentDocs.push({
			id: s.id,
			type: "study",
			name: (s as any).name || t("recentDocs.study"),
			createdAt: (s as any).createdAt,
			href: `${basePath}/pricing/studies/${s.id}`,
			icon: Calculator,
			iconColor: "text-violet-600 dark:text-violet-400",
			bgColor: "bg-violet-50 dark:bg-violet-950/20",
			status,
			statusLabelKey: status
				? `pricing.studies.status.${status.toLowerCase()}`
				: undefined,
		});
	}

	recentDocs.sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	const visibleDocs = recentDocs.slice(0, 4);

	if (visibleDocs.length === 0) {
		return (
			<div className="rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-border/50 shadow-lg shadow-black/5 flex flex-col items-center justify-center p-3.5 text-center">
				<FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
				<p className="text-sm font-medium text-muted-foreground">
					{t("recentDocs.empty")}
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl bg-sky-50/30 dark:bg-sky-950/10 border border-sky-200/30 dark:border-sky-800/20 shadow-lg shadow-black/5 flex flex-col p-3.5">
			<h3 className="text-sm font-bold text-foreground mb-2">
				{t("recentDocs.title")}
			</h3>
			<div className="flex-1 space-y-1">
				{visibleDocs.map((doc) => {
					const Icon = doc.icon;
					const dateStr = new Intl.DateTimeFormat(locale, {
						day: "numeric",
						month: "short",
					}).format(new Date(doc.createdAt));
					// الحالة تُعرض فقط عند وجود ترجمة معتمدة لها — لا مفاتيح خام
					const statusLabel =
						doc.statusLabelKey && tAll.has(doc.statusLabelKey)
							? tAll(
									doc.statusLabelKey as Parameters<
										typeof tAll
									>[0],
								)
							: null;
					return (
						<Link
							key={doc.id}
							href={doc.href}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<div
								className={`p-1.5 rounded-lg ${doc.bgColor} shrink-0`}
							>
								<Icon
									className={`h-3.5 w-3.5 ${doc.iconColor}`}
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground truncate">
									{doc.name}
								</p>
								{doc.amount !== undefined && (
									<p className="text-xs text-foreground/70 tabular-nums">
										<Currency amount={doc.amount} />
									</p>
								)}
							</div>
							{statusLabel && doc.status && (
								<StatusChip
									status={doc.status}
									className="shrink-0"
								>
									{statusLabel}
								</StatusChip>
							)}
							<span className="text-xs text-foreground/70 shrink-0">
								{dateStr}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
