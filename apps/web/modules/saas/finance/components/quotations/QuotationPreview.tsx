"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, Download, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { TemplateRenderer } from "../templates/renderer";

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
	const basePath = `/app/${organizationSlug}/finance/quotations`;

	// Fetch quotation data
	const { data: quotation, isLoading: isLoadingQuotation } = useQuery(
		orpc.finance.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);

	// Fetch template (from quotation or default)
	const templateId = quotation?.templateId;
	const { data: linkedTemplate } = useQuery({
		...orpc.finance.templates.getById.queryOptions({
			input: { organizationId, id: templateId! },
		}),
		enabled: !!templateId,
	});

	const { data: defaultTemplate, isLoading: isLoadingDefaultTemplate } = useQuery({
		...orpc.finance.templates.getDefault.queryOptions({
			input: { organizationId, templateType: "QUOTATION" },
		}),
		enabled: !templateId,
	});

	// Fetch organization finance settings
	const { data: orgSettings, isLoading: isLoadingSettings } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	// Use linked template or default
	const template = templateId ? linkedTemplate : defaultTemplate;

	const isLoading = isLoadingQuotation || isLoadingSettings ||
		(templateId ? false : isLoadingDefaultTemplate);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	if (!quotation) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("finance.quotations.notFound")}</p>
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
		items: quotation.items.map((item) => ({
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
					<Button className="rounded-xl">
						<Download className="h-4 w-4 me-2" />
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
			<Card className="rounded-2xl max-w-4xl mx-auto print:shadow-none print:rounded-none print:border-none">
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
					.print-container,
					.print-container * {
						visibility: visible;
					}
					.print-container {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
					}
					.print\\:hidden {
						display: none !important;
					}
				}
			`}</style>
		</div>
	);
}
