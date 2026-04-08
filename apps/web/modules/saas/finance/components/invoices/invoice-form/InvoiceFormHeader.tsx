"use client";

import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import Link from "next/link";
import {
	Save,
	FileCheck,
	ChevronLeft,
	Eye,
	Printer,
	ArrowRight,
	CreditCard,
	Send,
	MoreVertical,
	QrCode,
} from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";

interface InvoiceFormHeaderProps {
	organizationSlug: string;
	basePath: string;
	isEditMode: boolean;
	invoiceId?: string;
	invoice?: {
		invoiceNo: string;
		status: string;
		invoiceType: string;
	} | null;
	quotation?: { quotationNo: string } | null;
	isBusy: boolean;
	canAddPayment: boolean;
	isCreateAndIssuePending: boolean;
	isStatusMutationPending: boolean;
	isConvertToTaxPending: boolean;
	onPreview: () => void;
	onPaymentDialogOpen: () => void;
	onIssueClick: () => void;
	onSendClick: () => void;
	onConvertToTax: () => void;
}

export function InvoiceFormHeader({
	organizationSlug,
	basePath,
	isEditMode,
	invoiceId,
	invoice,
	quotation,
	isBusy,
	canAddPayment,
	isCreateAndIssuePending,
	isStatusMutationPending,
	isConvertToTaxPending,
	onPreview,
	onPaymentDialogOpen,
	onIssueClick,
	onSendClick,
	onConvertToTax,
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
							{isEditMode && invoice && (
								<>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<Link href={`${basePath}/${invoiceId}`} className="hover:text-foreground transition-colors">{invoice.invoiceNo}</Link>
								</>
							)}
						</nav>
						<h1 className="text-base font-bold leading-tight truncate flex items-center gap-2">
							{isEditMode && invoice ? (
								<>
									{invoice.invoiceNo}
									<StatusBadge status={invoice.status} type="invoice" />
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
					<Button
						type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
						onClick={onPreview}
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onPreview}><Printer className="h-4 w-4" /></Button>
					{isEditMode && canAddPayment && (
						<>
							<div className="w-px h-5 bg-border/50" />
							<Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs px-2.5" onClick={onPaymentDialogOpen}>
								<CreditCard className="h-3.5 w-3.5 me-1" />
								{t("finance.invoices.addPayment")}
							</Button>
						</>
					)}
					<div className="w-px h-5 bg-border/50" />
					<Button type="submit" variant="outline" size="sm" disabled={isBusy} className="hidden sm:flex h-8 rounded-lg text-xs px-3 shadow-sm">
						<Save className="h-3.5 w-3.5 me-1.5" />
						{isBusy ? t("common.saving") : isEditMode ? t("finance.invoices.saveChanges") : t("finance.invoices.saveAsDraft")}
					</Button>
					{(!isEditMode || invoice?.status === "DRAFT") && (
						<Button type="button" size="sm" disabled={isBusy} onClick={onIssueClick} className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
							<FileCheck className="h-3.5 w-3.5 me-1.5" />
							{isCreateAndIssuePending ? t("common.saving") : t("finance.invoices.issueInvoice")}
						</Button>
					)}
					{isEditMode && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="rounded-xl">
								{invoice?.status === "DRAFT" && (
									<DropdownMenuItem onClick={onSendClick} disabled={isStatusMutationPending}>
										<Send className="h-4 w-4 me-2" />
										{t("finance.invoices.actions.send")}
									</DropdownMenuItem>
								)}
								{invoice?.invoiceType !== "TAX" && invoice?.status !== "CANCELLED" && (
									<DropdownMenuItem onClick={onConvertToTax} disabled={isConvertToTaxPending}>
										<QrCode className="h-4 w-4 me-2" />
										{t("finance.invoices.actions.convertToTax")}
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</div>
	);
}
