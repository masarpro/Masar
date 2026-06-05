"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import Link from "next/link";
import {
	FileCheck,
	ChevronLeft,
	Eye,
	Printer,
	ArrowRight,
	Save,
} from "lucide-react";
import { AutosaveIndicator } from "@saas/shared/components/AutosaveIndicator";
import type { AutosaveState } from "@saas/shared/hooks/use-autosave";

interface InvoiceFormHeaderProps {
	organizationSlug: string;
	basePath: string;
	/** نعدّل فاتورة معتمدة عبر مسودة تعديل */
	isEditDraft: boolean;
	sourceInvoiceId?: string;
	sourceInvoiceNo?: string | null;
	quotation?: { quotationNo: string } | null;
	isBusy: boolean;
	isSaving: boolean;
	isIssuing: boolean;
	autosaveState: AutosaveState;
	onAutosaveRetry: () => void;
	onPreview: () => void;
	onSaveClick: () => void;
	onIssueClick: () => void;
}

export function InvoiceFormHeader({
	organizationSlug,
	basePath,
	isEditDraft,
	sourceInvoiceId,
	sourceInvoiceNo,
	quotation,
	isBusy,
	isSaving,
	isIssuing,
	autosaveState,
	onAutosaveRetry,
	onPreview,
	onSaveClick,
	onIssueClick,
}: InvoiceFormHeaderProps) {
	const t = useTranslations();

	return (
		<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
			<div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
				{/* Start: back + breadcrumb/title */}
				<div className="flex items-center gap-3 min-w-0">
					<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
						<Link href={`/app/${organizationSlug}/finance/invoices`}>
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
					<div className="min-w-0">
						<nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
							<Link href={`/app/${organizationSlug}/finance`} className="hover:text-foreground transition-colors">{t("finance.title")}</Link>
							<ChevronLeft className="h-3 w-3 shrink-0" />
							<Link href={`/app/${organizationSlug}/finance/invoices`} className="hover:text-foreground transition-colors">{t("finance.invoices.title")}</Link>
							{isEditDraft && sourceInvoiceId && (
								<>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<Link href={`${basePath}/${sourceInvoiceId}`} className="hover:text-foreground transition-colors">{sourceInvoiceNo ?? ""}</Link>
								</>
							)}
						</nav>
						<h1 className="text-base font-bold leading-tight truncate flex items-center gap-2">
							{isEditDraft ? (
								<>
									{sourceInvoiceNo ?? t("finance.invoices.title")}
									<span className="text-[10px] font-medium rounded-md px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
										{t("drafts.editDraftBadge")}
									</span>
								</>
							) : (
								<>
									{t("finance.invoices.create")}
									{quotation && (
										<span className="text-xs font-normal text-blue-600 dark:text-blue-400 ms-2">
											{t("finance.invoices.fromQuotation")} — {quotation.quotationNo}
										</span>
									)}
								</>
							)}
						</h1>
					</div>
				</div>

				{/* End: actions */}
				<div className="flex items-center gap-1.5 shrink-0">
					<AutosaveIndicator state={autosaveState} onRetry={onAutosaveRetry} mode="draft" className="hidden sm:inline-flex me-1" />
					<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onPreview}>
						<Eye className="h-4 w-4" />
					</Button>
					<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onPreview}><Printer className="h-4 w-4" /></Button>
					<div className="w-px h-5 bg-border/50" />
					<Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={onSaveClick} className="h-8 rounded-[10px] text-xs px-4">
						<Save className="h-3.5 w-3.5 me-1.5" />
						{isSaving ? t("common.saving") : t("common.save")}
					</Button>
					<Button type="button" size="sm" disabled={isBusy} onClick={onIssueClick} className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
						<FileCheck className="h-3.5 w-3.5 me-1.5" />
						{isIssuing ? t("common.saving") : t("finance.invoices.issueInvoice")}
					</Button>
				</div>
			</div>
		</div>
	);
}
