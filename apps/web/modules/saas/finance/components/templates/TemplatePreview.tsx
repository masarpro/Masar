"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Printer, Download, ArrowLeft, Loader2, ZoomInIcon, ZoomOutIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import { TemplateRenderer } from "./renderer/TemplateRenderer";
import type { TemplateElement } from "./TemplateCanvas";
import type { TemplateSettings } from "./PropertiesPanel";
import type { OrganizationData, QuotationData, InvoiceData } from "./renderer/TemplateRenderer";
import { getSampleData } from "../../lib/sample-preview-data";

interface TemplatePreviewProps {
	organizationId: string;
	organizationSlug: string;
	templateId: string;
}

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// Convert to pixels (assuming 96 DPI for screen)
const MM_TO_PX = 3.7795275591;
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;
const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;

export function TemplatePreview({
	organizationId,
	organizationSlug,
	templateId,
}: TemplatePreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/templates`;
	const [scale, setScale] = useState(0.7);

	const { data: template, isLoading } = useQuery(
		orpc.finance.templates.getById.queryOptions({
			input: { organizationId, id: templateId },
		}),
	);

	// Fetch organization finance settings for preview
	const { data: orgSettings } = useQuery(
		orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
	);

	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev + 0.1, 1.5));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev - 0.1, 0.3));
	}, []);

	const handleResetZoom = useCallback(() => {
		setScale(0.7);
	}, []);

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

	if (!template) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("finance.templates.notFound")}</p>
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

	const content = template.content as { elements?: TemplateElement[] } | null;
	const elements = content?.elements || [];
	const settings = (template.settings || {}) as TemplateSettings;
	const templateType = template.templateType.toLowerCase() as "quotation" | "invoice" | "letter";

	// Prepare organization data for renderer
	const organizationData: OrganizationData = {
		name: orgSettings?.companyNameAr ?? "",
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

	// Get sample data for preview
	const sampleData = getSampleData(templateType, settings);

	// Prepare template config for renderer
	const templateConfig = {
		elements,
		settings: {
			backgroundColor: settings.backgroundColor,
			primaryColor: settings.primaryColor,
			fontFamily: settings.fontFamily,
			fontSize: settings.fontSize,
			vatPercent: settings.vatPercent,
			currency: settings.currency,
		},
	};

	return (
		<div className="space-y-4">
			{/* Actions Bar - Hide on print */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={`${basePath}/${templateId}`}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("finance.templates.editor.title")}
					</Button>
				</Link>
				<div className="flex items-center gap-2">
					{/* Zoom Controls */}
					<div className="flex items-center gap-1 border-e pe-2 me-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleZoomOut}
							disabled={scale <= 0.3}
						>
							<ZoomOutIcon className="h-4 w-4" />
						</Button>
						<span className="text-xs text-slate-500 w-12 text-center">
							{Math.round(scale * 100)}%
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleZoomIn}
							disabled={scale >= 1.5}
						>
							<ZoomInIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleResetZoom}
						>
							<RotateCcwIcon className="h-4 w-4" />
						</Button>
					</div>
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

			{/* Template Name */}
			<div className="text-center print:hidden">
				<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{template.name}</h2>
				<p className="text-sm text-slate-500">
					{t(`finance.templates.types.${templateType}`)}
				</p>
			</div>

			{/* Preview Container */}
			<div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 overflow-auto print:bg-transparent print:p-0 print:rounded-none">
				<div
					className="mx-auto print:mx-0"
					style={{
						width: A4_WIDTH_PX * scale,
						minHeight: A4_HEIGHT_PX * scale,
					}}
				>
					{/* A4 Paper */}
					<div
						className="bg-white shadow-2xl print:shadow-none"
						style={{
							width: A4_WIDTH_PX,
							minHeight: A4_HEIGHT_PX,
							transform: `scale(${scale})`,
							transformOrigin: "top left",
						}}
					>
						<TemplateRenderer
							data={sampleData}
							template={templateConfig}
							organization={organizationData}
							documentType={templateType === "letter" ? "quotation" : templateType}
							interactive={false}
						/>
					</div>
				</div>
			</div>

			{/* Print styles */}
			<style jsx global>{`
				@media print {
					body * {
						visibility: hidden;
					}
					.print\\:hidden {
						display: none !important;
					}
					[data-print-area],
					[data-print-area] * {
						visibility: visible;
					}
					[data-print-area] {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
}
