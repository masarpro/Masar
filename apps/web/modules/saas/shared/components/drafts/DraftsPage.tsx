"use client";

import { Button } from "@ui/components/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DraftsTable } from "./DraftsTable";

interface DraftsPageProps {
	kind: "invoice" | "quotation";
	organizationId: string;
	organizationSlug: string;
}

export function DraftsPage({ kind, organizationId, organizationSlug }: DraftsPageProps) {
	const t = useTranslations();
	const backHref =
		kind === "quotation"
			? `/app/${organizationSlug}/pricing/quotations`
			: `/app/${organizationSlug}/finance/invoices`;
	const sectionTitle =
		kind === "quotation" ? t("drafts.tabs.quotations") : t("drafts.tabs.invoices");

	return (
		<div className="space-y-5 max-w-6xl mx-auto">
			{/* Header */}
			<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
						<Link href={backHref}>
							<ArrowRight className="h-4 w-4 rtl:rotate-180" />
						</Link>
					</Button>
					<div className="min-w-0">
						<p className="text-[11px] text-muted-foreground mb-0.5">{sectionTitle}</p>
						<h1 className="text-base font-bold leading-tight">{t("drafts.title")}</h1>
					</div>
				</div>
			</div>

			<DraftsTable kind={kind} organizationId={organizationId} organizationSlug={organizationSlug} />
		</div>
	);
}
