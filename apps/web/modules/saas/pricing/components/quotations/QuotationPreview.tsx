"use client";

import { useState } from "react";
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
		window.print();
	};

	const defaultFilename = `${quotation.quotationNo}-${quotation.clientName || "quotation"}`;

	const handleDownloadPdf = async (filename: string) => {
		const element = document.getElementById("quotation-print-area");
		if (!element) return;

		setIsGeneratingPdf(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;

			await html2pdf()
				.set({
					margin: [10, 12, 10, 12],
					filename: `${filename || defaultFilename}.pdf`,
					image: { type: "jpeg", quality: 0.98 },
					html2canvas: {
						scale: 2,
						useCORS: true,
						logging: false,
					},
					jsPDF: {
						unit: "mm",
						format: "a4",
						orientation: "portrait",
					},
				} as any)
				.from(element)
				.save();
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
					body * {
						visibility: hidden;
					}
					#quotation-print-area,
					#quotation-print-area * {
						visibility: visible;
					}
					#quotation-print-area {
						position: absolute;
						left: 0;
						top: 0;
						width: 210mm;
						margin: 0;
						padding: 0;
						box-shadow: none !important;
						border: none !important;
						border-radius: 0 !important;
					}
					@page {
						size: A4;
						margin: 15mm;
					}
				}
			`}</style>

			{/* PDF Filename Dialog */}
			<Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.actions.downloadPdf")}</DialogTitle>
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
