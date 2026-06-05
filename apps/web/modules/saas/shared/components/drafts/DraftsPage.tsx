"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Button } from "@ui/components/button";
import { ArrowRight, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DraftsTable } from "./DraftsTable";

interface DraftsPageProps {
	organizationId: string;
	organizationSlug: string;
	defaultTab?: "invoices" | "quotations";
}

export function DraftsPage({ organizationId, organizationSlug, defaultTab = "invoices" }: DraftsPageProps) {
	const t = useTranslations();
	const [tab, setTab] = useState<string>(defaultTab);
	const backHref =
		tab === "quotations"
			? `/app/${organizationSlug}/pricing/quotations`
			: `/app/${organizationSlug}/finance/invoices`;

	return (
		<div className="space-y-5 max-w-6xl mx-auto">
			{/* Header */}
			<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
						<Link href={backHref}>
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
					<h1 className="text-base font-bold leading-tight">{t("drafts.title")}</h1>
				</div>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="invoices" className="gap-1.5">
						<Receipt className="h-4 w-4" />
						{t("drafts.tabs.invoices")}
					</TabsTrigger>
					<TabsTrigger value="quotations" className="gap-1.5">
						<FileText className="h-4 w-4" />
						{t("drafts.tabs.quotations")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="invoices" className="mt-4">
					<DraftsTable kind="invoice" organizationId={organizationId} organizationSlug={organizationSlug} />
				</TabsContent>
				<TabsContent value="quotations" className="mt-4">
					<DraftsTable kind="quotation" organizationId={organizationId} organizationSlug={organizationSlug} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
