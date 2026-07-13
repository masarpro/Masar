"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	Calculator,
	FileText,
	Receipt,
} from "lucide-react";
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
}

export function RecentDocumentsCard({
	organizationId,
	organizationSlug,
}: RecentDocumentsCardProps) {
	const t = useTranslations("dashboard");
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

	for (const inv of (invoicesData?.invoices ?? []).slice(0, 3)) {
		recentDocs.push({
			id: inv.id,
			type: "invoice",
			name: `${t("recentDocs.invoice")} #${(inv as any).invoiceNo}`,
			createdAt: (inv as any).createdAt,
			href: `${basePath}/finance/invoices/${inv.id}`,
			icon: Receipt,
			iconColor: "text-chart-4 dark:text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		});
	}

	for (const q of (quotationsData?.quotations ?? []).slice(0, 3)) {
		recentDocs.push({
			id: q.id,
			type: "quotation",
			name: `${t("recentDocs.quotation")} #${(q as any).quotationNo}`,
			createdAt: (q as any).createdAt,
			href: `${basePath}/pricing/quotations/${q.id}`,
			icon: FileText,
			iconColor: "text-chart-4 dark:text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		});
	}

	for (const s of (studiesData?.costStudies ?? []).slice(0, 3)) {
		recentDocs.push({
			id: s.id,
			type: "study",
			name: (s as any).name || t("recentDocs.study"),
			createdAt: (s as any).createdAt,
			href: `${basePath}/pricing/studies/${s.id}`,
			icon: Calculator,
			iconColor: "text-chart-4 dark:text-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
		});
	}

	recentDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	const visibleDocs = recentDocs.slice(0, 4);

	if (visibleDocs.length === 0) {
		return (
			<div className="rounded-2xl bg-muted dark:bg-muted border border-border/50 flex flex-col items-center justify-center p-3.5 text-center">
				<FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
				<p className="text-sm font-medium text-muted-foreground">
					{t("recentDocs.empty")}
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl bg-chart-4/15 dark:bg-chart-4/20 border border-chart-4/30 dark:border-chart-4/20 flex flex-col p-3.5">
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
					return (
						<Link
							key={doc.id}
							href={doc.href}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-card dark:hover:bg-muted transition-colors"
						>
							<div className={`p-1.5 rounded-lg ${doc.bgColor} shrink-0`}>
								<Icon className={`h-3.5 w-3.5 ${doc.iconColor}`} />
							</div>
							<p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
								{doc.name}
							</p>
							<span className="text-xs text-muted-foreground shrink-0">
								{dateStr}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
