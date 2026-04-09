"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Printer, Download, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TemplateRenderer } from "@saas/company/components/templates/renderer";
import { useEnsureDefaultTemplate } from "@saas/shared/hooks/use-ensure-default-template";
import { PreviewPageSkeleton } from "@saas/shared/components/skeletons";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";

interface QuotationPreviewProps {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

export function QuotationPreview({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationPreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/quotations`;

	// PDF download state
	const [showFilenameDialog, setShowFilenameDialog] = useState(false);
	const [pdfFilename, setPdfFilename] = useState("");
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

	// Browser print handler: physically move #quotation-print-area to be a direct
	// child of body before printing, so CSS selectors can isolate it cleanly.
	// Restores original DOM position after printing.
	useEffect(() => {
		const PRINT_ID = "quotation-print-area";

		const handleBeforePrint = () => {
			const printArea = document.getElementById(PRINT_ID);
			if (
				printArea &&
				printArea.parentNode &&
				printArea.parentNode !== document.body
			) {
				(printArea as any).__originalParent = printArea.parentNode;
				(printArea as any).__originalNextSibling = printArea.nextSibling;
				document.body.appendChild(printArea);
				document.body.setAttribute("data-printing", "true");
			}
		};

		const handleAfterPrint = () => {
			const printArea = document.getElementById(PRINT_ID) as any;
			if (printArea?.__originalParent) {
				printArea.__originalParent.insertBefore(
					printArea,
					printArea.__originalNextSibling,
				);
				delete printArea.__originalParent;
				delete printArea.__originalNextSibling;
			}
			document.body.removeAttribute("data-printing");
		};

		window.addEventListener("beforeprint", handleBeforePrint);
		window.addEventListener("afterprint", handleAfterPrint);

		return () => {
			window.removeEventListener("beforeprint", handleBeforePrint);
			window.removeEventListener("afterprint", handleAfterPrint);
		};
	}, []);

	// Fetch quotation data
	const { data: quotationRaw, isLoading: isLoadingQuotation } = useQuery(
		orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);
	const quotation = quotationRaw as any;

	// القالب يأتي مع بيانات عرض السعر مباشرة
	const linkedTemplate = quotation?.template;

	// Fetch default template only if quotation has no template
	const { data: defaultTemplate, isLoading: isLoadingDefaultTemplate } = useQuery({
		...orpc.company.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "QUOTATION" },
		}),
		enabled: !linkedTemplate,
	});

	// Fetch organization finance settings
	const { data: orgSettingsRaw, isLoading: isLoadingSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});
	const orgSettings = orgSettingsRaw as any;

	// Use linked template or default
	const template = linkedTemplate || defaultTemplate;

	// Auto-seed templates if none exist
	useEnsureDefaultTemplate(
		organizationId,
		linkedTemplate || defaultTemplate,
		isLoadingDefaultTemplate,
	);

	const isLoading = isLoadingQuotation || isLoadingSettings ||
		(!linkedTemplate && isLoadingDefaultTemplate);

	if (isLoading) {
		return <PreviewPageSkeleton />;
	}

	if (!quotation) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("pricing.quotations.notFound")}</p>
				<Link href={basePath}>
					<Button variant="outline" className="mt-4 rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("common.back")}
					</Button>
				</Link>
			</div>
		);
	}

	const handlePrint = () => {
		printDocument();
	};

	const defaultFilename = `${quotation.quotationNo}-${quotation.clientName || "quotation"}`;

	const handleDownloadPdf = async (filename: string) => {
		setIsGeneratingPdf(true);
		try {
			await exportToPDF(filename || defaultFilename);
		} catch (error) {
			console.error("PDF generation failed:", error);
			toast.error(t("common.error"));
		} finally {
			setIsGeneratingPdf(false);
			setShowFilenameDialog(false);
		}
	};

	// Prepare data for TemplateRenderer
	const quotationData = {
		quotationNo: quotation.quotationNo,
		createdAt: quotation.createdAt,
		validUntil: quotation.validUntil,
		status: quotation.status,
		clientName: quotation.clientName,
		clientCompany: quotation.clientCompany ?? undefined,
		clientPhone: quotation.clientPhone ?? undefined,
		clientEmail: quotation.clientEmail ?? undefined,
		clientAddress: quotation.clientAddress ?? undefined,
		clientTaxNumber: quotation.clientTaxNumber ?? undefined,
		items: quotation.items.map((item: any) => ({
			description: item.description,
			quantity: item.quantity,
			unit: item.unit ?? undefined,
			unitPrice: item.unitPrice,
			totalPrice: item.totalPrice,
		})),
		subtotal: Number(quotation.subtotal),
		discountPercent: Number(quotation.discountPercent),
		discountAmount: Number(quotation.discountAmount),
		vatPercent: Number(quotation.vatPercent),
		vatAmount: Number(quotation.vatAmount),
		totalAmount: Number(quotation.totalAmount),
		paymentTerms: quotation.paymentTerms ?? undefined,
		deliveryTerms: quotation.deliveryTerms ?? undefined,
		warrantyTerms: quotation.warrantyTerms ?? undefined,
		notes: quotation.notes ?? undefined,
		introduction: quotation.introduction ?? undefined,
		termsAndConditions: quotation.termsAndConditions ?? undefined,
		contentBlocks: (quotation.contentBlocks ?? []).map((b: any) => ({
			title: b.title,
			content: b.content,
			position: b.position,
		})),
	};

	const templateConfig = {
		elements: (template?.content as { elements?: any[] })?.elements || [],
		settings: (template?.settings as any) || {},
	};

	const organizationData = {
		name: orgSettings?.companyNameAr ?? undefined,
		nameAr: orgSettings?.companyNameAr ?? undefined,
		nameEn: orgSettings?.companyNameEn ?? undefined,
		logo: orgSettings?.logo ?? undefined,
		address: orgSettings?.address ?? undefined,
		addressAr: orgSettings?.address ?? undefined,
		addressEn: orgSettings?.addressEn ?? undefined,
		phone: orgSettings?.phone ?? undefined,
		email: orgSettings?.email ?? undefined,
		website: orgSettings?.website ?? undefined,
		taxNumber: orgSettings?.taxNumber ?? undefined,
		commercialReg: orgSettings?.commercialReg ?? undefined,
		bankName: orgSettings?.bankName ?? undefined,
		bankNameEn: orgSettings?.bankNameEn ?? undefined,
		accountName: orgSettings?.accountName ?? undefined,
		iban: orgSettings?.iban ?? undefined,
		accountNumber: orgSettings?.accountNumber ?? undefined,
		swiftCode: orgSettings?.swiftCode ?? undefined,
		headerText: orgSettings?.headerText ?? undefined,
		footerText: orgSettings?.footerText ?? undefined,
		thankYouMessage: orgSettings?.thankYouMessage ?? undefined,
	};

	return (
		<div className="space-y-4">
			{/* Actions Bar - Hide on print */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={`${basePath}/${quotationId}`}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("common.back")}
					</Button>
				</Link>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handlePrint} className="rounded-xl">
						<Printer className="h-4 w-4 me-2" />
						{t("finance.actions.print")}
					</Button>
					<Button
						className="rounded-xl"
						onClick={() => {
							setPdfFilename(defaultFilename);
							setShowFilenameDialog(true);
						}}
						disabled={isGeneratingPdf}
					>
						{isGeneratingPdf ? (
							<Loader2 className="h-4 w-4 animate-spin me-2" />
						) : (
							<Download className="h-4 w-4 me-2" />
						)}
						{t("finance.actions.downloadPdf")}
					</Button>
				</div>
			</div>

			{/* Template name badge */}
			{template && (
				<div className="text-center print:hidden">
					<p className="text-sm text-slate-500">
						{t("finance.templates.select")}: {template.name}
					</p>
				</div>
			)}

			{/* Preview Content using TemplateRenderer */}
			<Card id="quotation-print-area" className="rounded-2xl max-w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:border-none print:min-h-0 print:max-w-none">
				<CardContent className="p-0 print:p-0">
					<TemplateRenderer
						data={quotationData}
						template={templateConfig}
						organization={organizationData}
						documentType="quotation"
						className="print:p-4"
					/>
				</CardContent>
			</Card>

			{/* Print styles */}
			<style jsx global>{`
				@media print {
					@page {
						size: A4 portrait;
						margin: 50mm 0 35mm 0;
					}

					/* When body has data-printing (set by beforeprint event or Puppeteer),
					   hide all direct children except the print area that was moved to body root */
					body[data-printing="true"] > *:not(#quotation-print-area):not(script):not(style) {
						display: none !important;
					}

					body[data-printing="true"] {
						margin: 0 !important;
						padding: 0 !important;
						background: white !important;
					}

					#quotation-print-area {
						display: block !important;
						width: 210mm !important;
						max-width: 210mm !important;
						margin: 0 auto !important;
						padding: 0 !important;
						box-shadow: none !important;
						border: none !important;
						border-radius: 0 !important;
						background: white !important;
					}

					#quotation-print-area [class*="rounded"] {
						border-radius: 0 !important;
					}
				}
			`}</style>

			{/* PDF Filename Dialog */}
			<Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.actions.downloadPdf")}</DialogTitle>
						<DialogDescription className="sr-only">
							{t("finance.actions.downloadPdf")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>{t("common.fileName")}</Label>
							<div className="flex items-center gap-2 mt-1.5">
								<Input
									value={pdfFilename}
									onChange={(e: any) => setPdfFilename(e.target.value)}
									placeholder={defaultFilename}
									dir="auto"
									className="rounded-xl"
								/>
								<span className="text-sm text-muted-foreground shrink-0">.pdf</span>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setShowFilenameDialog(false)} className="rounded-xl">
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => handleDownloadPdf(pdfFilename)}
							disabled={isGeneratingPdf}
							className="rounded-xl"
						>
							{isGeneratingPdf ? (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							) : (
								<Download className="h-4 w-4 me-2" />
							)}
							{t("common.download")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
