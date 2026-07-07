"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";
import { resolveImageSrc } from "@saas/shared/lib/image-src";

interface QuotationPreviewV2Props {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

const FORMAT_LABEL_KEYS: Record<string, string> = {
	DETAILED_BOQ: "formats.detailedBoq",
	PER_SQM: "formats.perSqm",
	LUMP_SUM: "formats.lumpSum",
	CUSTOM: "formats.custom",
};

const SECTION_LABEL_KEYS: Record<string, string> = {
	STRUCTURAL: "sectionLabels.structural",
	FINISHING: "sectionLabels.finishing",
	MEP: "sectionLabels.mep",
	LABOR: "sectionLabels.labor",
	MANUAL: "sectionLabels.manual",
};

type Translator = ReturnType<typeof useTranslations>;

// ────────────────────────────────────────────────────────────────
// Section break definition stored in displayConfig.sectionBreaks
// ────────────────────────────────────────────────────────────────
interface SectionBreak {
	afterIndex: number; // cumulative item count at end of this section
	section: string; // e.g. "STRUCTURAL"
	label: string; // e.g. "إنشائي"
	subtotal: number; // sum of totalPrice for items in section
}

export function QuotationPreviewV2({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationPreviewV2Props) {
	const t = useTranslations("pricing.quotationBuilder");
	const basePath = `/app/${organizationSlug}/pricing/quotations`;

	const { data: quotation, isLoading: isLoadingQuotation } = useQuery(
		orpc.pricing.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);

	const { data: orgSettings, isLoading: isLoadingSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	// PDF download state — MUST be declared before any early return so the
	// hook order stays stable across renders (Rules of Hooks).
	const [showFilenameDialog, setShowFilenameDialog] = useState(false);
	const [pdfFilename, setPdfFilename] = useState("");
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

	const fmt = (n: number) =>
		Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

	const org = orgSettings as any;
	const isLoading = isLoadingQuotation || isLoadingSettings;

	if (isLoading) {
		return (
			<div className="flex justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!quotation) {
		return (
			<div className="text-center py-20">
				<p className="text-muted-foreground">{t("notFound")}</p>
				<Link href={basePath}>
					<Button variant="outline" className="mt-4 rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("actions.back")}
					</Button>
				</Link>
			</div>
		);
	}

	const q = quotation as any;
	const displayConfig = q.displayConfig;
	const format: string = displayConfig?.format ?? "DETAILED_BOQ";
	const items = (quotation as any).items ?? [];
	const subtotal = Number((quotation as any).subtotal);
	const discountAmount = Number((quotation as any).discountAmount);
	const discountPercent = Number((quotation as any).discountPercent);
	const vatPercent = Number((quotation as any).vatPercent);
	const vatAmount = Number((quotation as any).vatAmount);
	const totalAmount = Number((quotation as any).totalAmount);
	const afterDiscount = subtotal - discountAmount;
	const status: string = (quotation as any).status ?? "DRAFT";
	const isDraft = status === "DRAFT";

	const handlePrint = () => printDocument();

	const defaultFilename = `${q.quotationNo}-${q.clientName || "quotation"}`;

	const handleDownloadPdf = async (filename: string) => {
		setIsGeneratingPdf(true);
		try {
			await exportToPDF(filename || defaultFilename);
		} catch (error) {
			console.error("PDF generation failed:", error);
			toast.error(t("toasts.pdfError"));
		} finally {
			setIsGeneratingPdf(false);
			setShowFilenameDialog(false);
		}
	};

	// Determine visible columns from display config
	const showItemNumber = displayConfig?.showItemNumber ?? true;
	const showDescription = displayConfig?.showDescription ?? true;
	const showSpecifications = displayConfig?.showSpecifications ?? false;
	const showQuantity = displayConfig?.showQuantity ?? true;
	const showUnit = displayConfig?.showUnit ?? true;
	const showUnitPrice = displayConfig?.showUnitPrice ?? true;
	const showItemTotal = displayConfig?.showItemTotal ?? true;
	const showSubtotal = displayConfig?.showSubtotal ?? true;
	const showDiscount = displayConfig?.showDiscount ?? true;
	const showVAT = displayConfig?.showVAT ?? true;
	const showGrandTotal = displayConfig?.showGrandTotal ?? true;
	const showPricePerSqm = displayConfig?.showPricePerSqm ?? false;
	const showSectionSubtotal = displayConfig?.showSectionSubtotal ?? false;
	const totalArea = displayConfig?.totalArea ? Number(displayConfig.totalArea) : 0;
	const pricePerSqm = displayConfig?.pricePerSqm ? Number(displayConfig.pricePerSqm) : 0;
	const lumpSumAmount = displayConfig?.lumpSumAmount ? Number(displayConfig.lumpSumAmount) : 0;
	const lumpSumDescription = displayConfig?.lumpSumDescription ?? "";
	const grouping = displayConfig?.grouping ?? "FLAT";
	const sectionBreaks: SectionBreak[] = displayConfig?.sectionBreaks ?? [];

	const colCount = [showItemNumber, showDescription, showSpecifications, showQuantity, showUnit, showUnitPrice, showItemTotal].filter(Boolean).length;

	return (
		<div className="space-y-4" dir="rtl">
			{/* Actions Bar */}
			<div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
				<Link href={`${basePath}/${quotationId}`}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("actions.back")}
					</Button>
				</Link>
				<div className="flex flex-wrap items-center gap-2">
					{/* Format badge */}
					<span className="text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1">
						{FORMAT_LABEL_KEYS[format] ? t(FORMAT_LABEL_KEYS[format]) : format}
					</span>
					<Button variant="outline" onClick={handlePrint} className="rounded-xl">
						<Printer className="h-4 w-4 me-2" />
						{t("actions.print")}
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
						{t("actions.exportPdf")}
					</Button>
				</div>
			</div>

			{/* Preview Card */}
			<Card id="quotation-print-area" className="quotation-preview rounded-2xl max-w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:border-none relative overflow-hidden">
				{/* DRAFT watermark */}
				{isDraft && (
					<div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden print:flex">
						<span className="text-[120px] font-black text-muted-foreground/[0.06] -rotate-45 select-none whitespace-nowrap tracking-widest">
							{t("preview.draftWatermark")}
						</span>
					</div>
				)}

				<CardContent className="p-0 print:p-0 relative z-20">
					{/* PDF Header Section */}
					<div data-pdf-header className="p-5 pb-4 sm:p-8 sm:pb-4 print:p-6 print:pb-3 space-y-6">
						{/* Header with subtle gradient */}
						<div className="rounded-xl bg-gradient-to-l from-primary/5 via-transparent to-transparent -mx-2 px-2 py-1">
							<div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-6 border-b border-border pb-6">
								<div>
									{org?.logo && (
										// NOTE: <img> used intentionally — print/template context where next/Image optimization doesn't apply
										<img src={resolveImageSrc(org.logo)} alt="" className="h-16 mb-3 object-contain" />
									)}
									<p className="font-bold text-lg leading-relaxed">{org?.companyNameAr ?? ""}</p>
									{org?.address && (
										<p className="text-sm text-muted-foreground mt-0.5">{org.address}</p>
									)}
									{org?.phone && (
										<p className="text-sm text-muted-foreground">{org.phone}</p>
									)}
								</div>
								<div className="text-left space-y-1.5">
									<h2 className="text-2xl font-bold text-primary tracking-tight">{t("preview.title")}</h2>
									<p className="text-xs text-muted-foreground uppercase tracking-wide">QUOTATION</p>
									<div className="space-y-1 mt-3">
										<p className="text-sm">
											<span className="text-muted-foreground">{t("fields.number")}:</span>{" "}
											<span className="font-semibold">{q.quotationNo}</span>
										</p>
										<p className="text-sm">
											<span className="text-muted-foreground">{t("fields.date")}:</span>{" "}
											<span className="font-medium">
												{new Date(q.createdAt).toLocaleDateString("ar-SA")}
											</span>
										</p>
										<p className="text-sm">
											<span className="text-muted-foreground">{t("fields.validUntil")}:</span>{" "}
											<span className="font-medium">
												{new Date(q.validUntil).toLocaleDateString("ar-SA")}
											</span>
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Client info */}
						<div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-1.5">
							<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("sections.clientInfo")}</p>
							<p className="text-sm">
								<span className="text-muted-foreground">{t("fields.client")}:</span>{" "}
								<span className="font-semibold">{q.clientName}</span>
							</p>
							{q.clientCompany && (
								<p className="text-sm">
									<span className="text-muted-foreground">{t("fields.company")}:</span>{" "}
									{q.clientCompany}
								</p>
							)}
							{q.clientPhone && (
								<p className="text-sm">
									<span className="text-muted-foreground">{t("fields.phone")}:</span>{" "}
									<span dir="ltr">{q.clientPhone}</span>
								</p>
							)}
							{q.clientTaxNumber && (
								<p className="text-sm">
									<span className="text-muted-foreground">{t("fields.taxNumber")}:</span>{" "}
									<span dir="ltr">{q.clientTaxNumber}</span>
								</p>
							)}
						</div>
					</div>

					{/* PDF Body Section */}
					<div data-pdf-body className="px-5 sm:px-8 print:px-6 space-y-6">

					{/* ─── Introduction ─── */}
					{q.introduction && (
						<div className="text-sm leading-relaxed whitespace-pre-line">{q.introduction}</div>
					)}

					{/* ─── Content Blocks: BEFORE_TABLE ─── */}
					{q.contentBlocks
						?.filter((b: any) => b.position === "BEFORE_TABLE")
						.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
						.map((block: any, idx: number) => (
							<div key={block.id || idx} className="space-y-1">
								<h4 className="font-semibold text-sm">{block.title}</h4>
								<p className="text-sm text-muted-foreground whitespace-pre-line">{block.content}</p>
							</div>
						))}

					{/* ─── LUMP_SUM Format ─── */}
					{format === "LUMP_SUM" && (
						<LumpSumView
							lumpSumDescription={lumpSumDescription}
							lumpSumAmount={lumpSumAmount || subtotal}
							fmt={fmt}
						/>
					)}

					{/* ─── PER_SQM Format ─── */}
					{format === "PER_SQM" && (
						<PerSqmView
							totalArea={totalArea}
							pricePerSqm={pricePerSqm}
							subtotal={subtotal}
							items={items}
							showSectionSubtotal={showSectionSubtotal}
							fmt={fmt}
							colCount={colCount}
						/>
					)}

					{/* ─── DETAILED_BOQ / CUSTOM Format ─── */}
					{(format === "DETAILED_BOQ" || format === "CUSTOM") && items.length > 0 && (
						<DetailedBoqTable
							items={items}
							grouping={grouping}
							sectionBreaks={sectionBreaks}
							showItemNumber={showItemNumber}
							showDescription={showDescription}
							showSpecifications={showSpecifications}
							showQuantity={showQuantity}
							showUnit={showUnit}
							showUnitPrice={showUnitPrice}
							showItemTotal={showItemTotal}
							showSectionSubtotal={showSectionSubtotal}
							colCount={colCount}
							fmt={fmt}
						/>
					)}

					{/* Price per sqm info (for DETAILED_BOQ / CUSTOM when enabled) */}
					{format !== "PER_SQM" && format !== "LUMP_SUM" && showPricePerSqm && totalArea > 0 && (
						<div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-1.5 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("fields.totalArea")}</span>
								<span dir="ltr">{fmt(totalArea)} م²</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("fields.pricePerSqm")}</span>
								<span dir="ltr" className="font-medium">{fmt(pricePerSqm)} {t("currencyPerSqm")}</span>
							</div>
						</div>
					)}

					{/* Totals */}
					<div className="space-y-2 text-sm border-t-2 border-primary/20 pt-4">
						{showSubtotal && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("totals.subtotal")}</span>
								<span dir="ltr">{fmt(subtotal)} {t("currency")}</span>
							</div>
						)}
						{showDiscount && discountAmount > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("totals.discount")} {discountPercent > 0 ? `(${fmt(discountPercent)}%)` : ""}
								</span>
								<span className="text-red-500" dir="ltr">-{fmt(discountAmount)} {t("currency")}</span>
							</div>
						)}
						{showDiscount && discountAmount > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">{t("totals.afterDiscount")}</span>
								<span dir="ltr">{fmt(afterDiscount)} {t("currency")}</span>
							</div>
						)}
						{showVAT && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("totals.vat", { percent: vatPercent })}
								</span>
								<span dir="ltr">{fmt(vatAmount)} {t("currency")}</span>
							</div>
						)}
						{showGrandTotal && (
							<div className="flex justify-between border-t-2 border-primary/20 pt-3 mt-3">
								<span className="font-bold text-base">{t("totals.grandTotal")}</span>
								<span className="font-bold text-xl text-primary" dir="ltr">
									{fmt(totalAmount)} {t("currency")}
								</span>
							</div>
						)}
						{showGrandTotal && (
							<div className="text-center text-muted-foreground text-xs mt-1.5">
								{t("totals.amountInWords", { words: numberToArabicWords(totalAmount) })}
							</div>
						)}
					</div>

					{/* ─── Content Blocks: AFTER_TABLE ─── */}
					{q.contentBlocks
						?.filter((b: any) => b.position === "AFTER_TABLE")
						.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
						.map((block: any, idx: number) => (
							<div key={block.id || idx} className="space-y-1">
								<h4 className="font-semibold text-sm">{block.title}</h4>
								<p className="text-sm text-muted-foreground whitespace-pre-line">{block.content}</p>
							</div>
						))}

					{/* ─── Terms & Conditions ─── */}
					{q.termsAndConditions && (
						<div className="border-t border-border pt-4 space-y-2.5 text-sm page-break-inside-avoid">
							<h4 className="font-semibold text-sm">{t("sections.generalTerms")}</h4>
							<p className="text-muted-foreground whitespace-pre-line">{q.termsAndConditions}</p>
						</div>
					)}

					{/* Terms */}
					{(q.paymentTerms || q.deliveryTerms || q.warrantyTerms || q.notes) && (
						<div className="border-t border-border pt-4 space-y-2.5 text-sm page-break-inside-avoid">
							<h4 className="font-semibold text-sm">{t("sections.terms")}</h4>
							{q.paymentTerms && (
								<p><span className="text-muted-foreground">{t("fields.paymentTerms")}:</span> {q.paymentTerms}</p>
							)}
							{q.deliveryTerms && (
								<p><span className="text-muted-foreground">{t("fields.deliveryTerms")}:</span> {q.deliveryTerms}</p>
							)}
							{q.warrantyTerms && (
								<p><span className="text-muted-foreground">{t("fields.warranty")}:</span> {q.warrantyTerms}</p>
							)}
							{q.notes && (
								<p><span className="text-muted-foreground">{t("fields.notes")}:</span> {q.notes}</p>
							)}
						</div>
					)}

					</div>

					{/* PDF Footer Section */}
					<div data-pdf-footer className="px-5 pb-8 sm:px-8 print:px-6 print:pb-6">
						{org?.thankYouMessage && (
							<div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
								{org.thankYouMessage}
							</div>
						)}
					</div>
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
					.print\\:hidden {
						display: none !important;
					}
					/* Page break handling */
					.page-break-inside-avoid {
						page-break-inside: avoid;
						break-inside: avoid;
					}
					.page-break-before {
						page-break-before: always;
						break-before: page;
					}
					table {
						page-break-inside: auto;
					}
					tr {
						page-break-inside: avoid;
						break-inside: avoid;
					}
					thead {
						display: table-header-group;
					}
					tfoot {
						display: table-footer-group;
					}
					@page {
						size: A4;
						margin: 0;
					}
				}
			`}</style>

			{/* PDF Filename Dialog */}
			<Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("actions.exportPdf")}</DialogTitle>
						<DialogDescription className="sr-only">
							{t("actions.exportPdf")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>{t("fields.filename")}</Label>
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
							{t("actions.cancel")}
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
							{t("actions.download")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════
// LUMP_SUM view — clean summary without detailed items
// ════════════════════════════════════════════════════════════════

function LumpSumView({
	lumpSumDescription,
	lumpSumAmount,
	fmt,
}: {
	lumpSumDescription: string;
	lumpSumAmount: number;
	fmt: (n: number) => string;
}) {
	const t = useTranslations("pricing.quotationBuilder");
	return (
		<div className="space-y-4 page-break-inside-avoid">
			{/* Description card */}
			<div className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-6 space-y-4">
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("lumpSum.scopeOfWork")}</p>
				<p className="text-sm leading-relaxed">
					{lumpSumDescription || t("lumpSum.defaultDescription")}
				</p>
				<div className="border-t border-primary/10 pt-4 mt-4">
					<div className="flex justify-between items-center">
						<span className="font-semibold text-base">{t("lumpSum.amount")}</span>
						<span className="text-2xl font-bold text-primary" dir="ltr">
							{fmt(lumpSumAmount)} {t("currency")}
						</span>
					</div>
				</div>
			</div>

			{/* Scope summary */}
			<div className="rounded-lg bg-muted/20 border border-border/50 p-4 text-xs text-muted-foreground">
				<p>{t("lumpSum.inclusionNote")}</p>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════
// PER_SQM view — building area and per-sqm price
// ════════════════════════════════════════════════════════════════

function PerSqmView({
	totalArea,
	pricePerSqm,
	subtotal,
	items,
	showSectionSubtotal,
	fmt,
	colCount,
}: {
	totalArea: number;
	pricePerSqm: number;
	subtotal: number;
	items: Array<{ id: string; description: string; quantity: number; unit: string | null; unitPrice: number; totalPrice: number }>;
	showSectionSubtotal: boolean;
	fmt: (n: number) => string;
	colCount: number;
}) {
	const t = useTranslations("pricing.quotationBuilder");
	return (
		<div className="space-y-4">
			{/* Prominent per-sqm display */}
			<div className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-6 page-break-inside-avoid">
				<div className="grid grid-cols-3 gap-6 text-center">
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">{t("fields.totalArea")}</p>
						<p className="text-xl font-bold" dir="ltr">{fmt(totalArea)} م²</p>
					</div>
					<div className="space-y-1 border-x border-primary/10 px-4">
						<p className="text-xs text-muted-foreground">{t("fields.pricePerSqm")}</p>
						<p className="text-xl font-bold text-primary" dir="ltr">{fmt(pricePerSqm)} {t("currencyPerSqm")}</p>
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">{t("totals.total")}</p>
						<p className="text-xl font-bold" dir="ltr">{fmt(subtotal)} {t("currency")}</p>
					</div>
				</div>
			</div>

			{/* Section breakdown table (if items exist and showSectionSubtotal) */}
			{showSectionSubtotal && items.length > 1 && (
				<div className="rounded-lg border border-border overflow-hidden overflow-x-auto page-break-inside-avoid">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40 text-muted-foreground">
								<th className="px-3 py-2.5 text-right font-medium">{t("table.section")}</th>
								<th className="px-3 py-2.5 text-center font-medium">{t("table.area")}</th>
								<th className="px-3 py-2.5 text-center font-medium">{t("table.pricePerSqmShort")}</th>
								<th className="px-3 py-2.5 text-center font-medium">{t("table.total")}</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => (
								<tr key={item.id} className="border-b last:border-0">
									<td className="px-3 py-2 font-medium">{item.description}</td>
									<td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.quantity))} م²</td>
									<td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.unitPrice))} {t("currency")}</td>
									<td className="px-3 py-2 text-center font-medium" dir="ltr">{fmt(Number(item.totalPrice))} {t("currency")}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="bg-muted/30 border-t-2 border-primary/20">
								<td className="px-3 py-2.5 font-bold" colSpan={3}>{t("table.total")}</td>
								<td className="px-3 py-2.5 text-center font-bold text-primary" dir="ltr">
									{fmt(subtotal)} {t("currency")}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			)}

			{/* Single item (no section breakdown) */}
			{(!showSectionSubtotal || items.length <= 1) && items.length > 0 && (
				<div className="rounded-lg bg-muted/20 border border-border/50 p-4 text-sm page-break-inside-avoid">
					<p className="text-muted-foreground">{items[0]?.description}</p>
				</div>
			)}
		</div>
	);
}

// ════════════════════════════════════════════════════════════════
// DETAILED_BOQ / CUSTOM table — with section grouping support
// ════════════════════════════════════════════════════════════════

function DetailedBoqTable({
	items,
	grouping,
	sectionBreaks,
	showItemNumber,
	showDescription,
	showSpecifications,
	showQuantity,
	showUnit,
	showUnitPrice,
	showItemTotal,
	showSectionSubtotal,
	colCount,
	fmt,
}: {
	items: Array<{ id: string; description: string; quantity: number; unit: string | null; unitPrice: number; totalPrice: number; sortOrder?: number }>;
	grouping: string;
	sectionBreaks: SectionBreak[];
	showItemNumber: boolean;
	showDescription: boolean;
	showSpecifications: boolean;
	showQuantity: boolean;
	showUnit: boolean;
	showUnitPrice: boolean;
	showItemTotal: boolean;
	showSectionSubtotal: boolean;
	colCount: number;
	fmt: (n: number) => string;
}) {
	const t = useTranslations("pricing.quotationBuilder");
	// Auto-detect sections from item descriptions if no sectionBreaks provided but grouping is BY_SECTION
	const autoSections = useMemo(() => {
		if (grouping !== "BY_SECTION" || sectionBreaks.length > 0) return [];
		return detectSectionsFromItems(items, t);
	}, [grouping, sectionBreaks.length, items, t]);

	const effectiveSectionBreaks = sectionBreaks.length > 0 ? sectionBreaks : autoSections;
	const useSections = grouping === "BY_SECTION" && effectiveSectionBreaks.length > 0;

	return (
		<div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/40 text-muted-foreground">
						{showItemNumber && <th className="px-3 py-2.5 text-right font-medium w-10">#</th>}
						{showDescription && <th className="px-3 py-2.5 text-right font-medium">{t("table.description")}</th>}
						{showSpecifications && <th className="px-3 py-2.5 text-center font-medium">{t("table.specifications")}</th>}
						{showQuantity && <th className="px-3 py-2.5 text-center font-medium">{t("table.quantity")}</th>}
						{showUnit && <th className="px-3 py-2.5 text-center font-medium">{t("table.unit")}</th>}
						{showUnitPrice && <th className="px-3 py-2.5 text-center font-medium">{t("table.unitPrice")}</th>}
						{showItemTotal && <th className="px-3 py-2.5 text-center font-medium">{t("table.total")}</th>}
					</tr>
				</thead>
				<tbody>
					{useSections
						? renderGroupedRows(
							items,
							effectiveSectionBreaks,
							showItemNumber,
							showDescription,
							showSpecifications,
							showQuantity,
							showUnit,
							showUnitPrice,
							showItemTotal,
							showSectionSubtotal,
							colCount,
							fmt,
							t,
						)
						: renderFlatRows(
							items,
							showItemNumber,
							showDescription,
							showSpecifications,
							showQuantity,
							showUnit,
							showUnitPrice,
							showItemTotal,
							fmt,
						)
					}
				</tbody>
			</table>
		</div>
	);
}

// Flat item rows (no grouping)
function renderFlatRows(
	items: Array<{ id: string; description: string; quantity: number; unit: string | null; unitPrice: number; totalPrice: number }>,
	showItemNumber: boolean,
	showDescription: boolean,
	showSpecifications: boolean,
	showQuantity: boolean,
	showUnit: boolean,
	showUnitPrice: boolean,
	showItemTotal: boolean,
	fmt: (n: number) => string,
) {
	return items.map((item, idx) => (
		<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
			{showItemNumber && <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>}
			{showDescription && <td className="px-3 py-2">{item.description}</td>}
			{showSpecifications && <td className="px-3 py-2 text-center text-muted-foreground">—</td>}
			{showQuantity && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.quantity))}</td>}
			{showUnit && <td className="px-3 py-2 text-center">{item.unit ?? ""}</td>}
			{showUnitPrice && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.unitPrice))}</td>}
			{showItemTotal && <td className="px-3 py-2 text-center font-medium" dir="ltr">{fmt(Number(item.totalPrice))}</td>}
		</tr>
	));
}

// Grouped rows with section headers and subtotals
function renderGroupedRows(
	items: Array<{ id: string; description: string; quantity: number; unit: string | null; unitPrice: number; totalPrice: number }>,
	sectionBreaks: SectionBreak[],
	showItemNumber: boolean,
	showDescription: boolean,
	showSpecifications: boolean,
	showQuantity: boolean,
	showUnit: boolean,
	showUnitPrice: boolean,
	showItemTotal: boolean,
	showSectionSubtotal: boolean,
	colCount: number,
	fmt: (n: number) => string,
	t: Translator,
) {
	const rows: ReactNode[] = [];
	let globalIdx = 0;

	// Sort section breaks by afterIndex to get correct ordering
	const sorted = [...sectionBreaks].sort((a, b) => a.afterIndex - b.afterIndex);

	let prevEnd = 0;
	for (let secIdx = 0; secIdx < sorted.length; secIdx++) {
		const sec = sorted[secIdx];
		const startIdx = prevEnd;
		const endIdx = sec.afterIndex;
		const sectionItems = items.slice(startIdx, endIdx);
		const sectionLabel =
			sec.label ||
			(SECTION_LABEL_KEYS[sec.section] ? t(SECTION_LABEL_KEYS[sec.section]) : sec.section);

		// Compute actual subtotal from items (fallback to sec.subtotal)
		const actualSubtotal = sectionItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
		const sectionSubtotal = actualSubtotal || sec.subtotal || 0;

		// Section header row
		rows.push(
			<tr key={`section-header-${secIdx}`} className="bg-primary/[0.04] border-b">
				<td colSpan={colCount} className="px-3 py-2.5">
					<span className="font-bold text-sm text-primary">{sectionLabel}</span>
				</td>
			</tr>
		);

		// Section items
		for (let i = 0; i < sectionItems.length; i++) {
			const item = sectionItems[i];
			globalIdx++;
			rows.push(
				<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
					{showItemNumber && <td className="px-3 py-2 text-muted-foreground pe-1">{globalIdx}</td>}
					{showDescription && <td className="px-3 py-2">{item.description}</td>}
					{showSpecifications && <td className="px-3 py-2 text-center text-muted-foreground">—</td>}
					{showQuantity && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.quantity))}</td>}
					{showUnit && <td className="px-3 py-2 text-center">{item.unit ?? ""}</td>}
					{showUnitPrice && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.unitPrice))}</td>}
					{showItemTotal && <td className="px-3 py-2 text-center font-medium" dir="ltr">{fmt(Number(item.totalPrice))}</td>}
				</tr>
			);
		}

		// Section subtotal row
		if (showSectionSubtotal && sectionSubtotal > 0) {
			rows.push(
				<tr key={`section-subtotal-${secIdx}`} className="bg-muted/30 border-b-2 border-border">
					<td colSpan={colCount - (showItemTotal ? 1 : 0)} className="px-3 py-2 text-end font-semibold text-sm">
						{t("table.sectionTotal", { section: sectionLabel })}
					</td>
					{showItemTotal && (
						<td className="px-3 py-2 text-center font-bold text-sm" dir="ltr">
							{fmt(sectionSubtotal)} {t("currency")}
						</td>
					)}
				</tr>
			);
		}

		prevEnd = endIdx;
	}

	// Remaining items (not covered by any section break)
	if (prevEnd < items.length) {
		const remaining = items.slice(prevEnd);
		if (remaining.length > 0 && sorted.length > 0) {
			rows.push(
				<tr key="section-header-other" className="bg-primary/[0.04] border-b">
					<td colSpan={colCount} className="px-3 py-2.5">
						<span className="font-bold text-sm text-primary">{t("sectionLabels.other")}</span>
					</td>
				</tr>
			);
		}
		for (const item of remaining) {
			globalIdx++;
			rows.push(
				<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
					{showItemNumber && <td className="px-3 py-2 text-muted-foreground">{globalIdx}</td>}
					{showDescription && <td className="px-3 py-2">{item.description}</td>}
					{showSpecifications && <td className="px-3 py-2 text-center text-muted-foreground">—</td>}
					{showQuantity && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.quantity))}</td>}
					{showUnit && <td className="px-3 py-2 text-center">{item.unit ?? ""}</td>}
					{showUnitPrice && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.unitPrice))}</td>}
					{showItemTotal && <td className="px-3 py-2 text-center font-medium" dir="ltr">{fmt(Number(item.totalPrice))}</td>}
				</tr>
			);
		}
	}

	return rows;
}

// ────────────────────────────────────────────────────────────────
// Auto-detect sections from item descriptions (heuristic)
// ────────────────────────────────────────────────────────────────

function detectSectionsFromItems(
	items: Array<{ id: string; description: string; totalPrice: number }>,
	t: Translator,
): SectionBreak[] {
	// Heuristic: look for known section keywords in consecutive item descriptions
	const sectionKeywords: Array<{ section: string; label: string; keywords: string[] }> = [
		{ section: "STRUCTURAL", label: t(SECTION_LABEL_KEYS.STRUCTURAL), keywords: ["خرسان", "حديد", "أساس", "عمود", "قاعد", "ميد", "سقف", "بلاط", "خرسان", "إنشائي"] },
		{ section: "FINISHING", label: t(SECTION_LABEL_KEYS.FINISHING), keywords: ["بلاط", "سيراميك", "دهان", "جبس", "أبواب", "نوافذ", "رخام", "تشطيب", "عزل"] },
		{ section: "MEP", label: t(SECTION_LABEL_KEYS.MEP), keywords: ["كهرب", "صحي", "سباك", "تكييف", "تمديد", "تأسيس كهرب", "تأسيس صحي"] },
		{ section: "LABOR", label: t(SECTION_LABEL_KEYS.LABOR), keywords: ["عمال", "مشرف", "حارس"] },
	];

	if (items.length < 3) return [];

	// Try to assign each item to a section
	const assignments: Array<string | null> = items.map((item) => {
		const desc = item.description.toLowerCase();
		for (const sec of sectionKeywords) {
			if (sec.keywords.some((kw) => desc.includes(kw))) {
				return sec.section;
			}
		}
		return null;
	});

	// Build section breaks from consecutive runs
	const breaks: SectionBreak[] = [];
	let currentSection: string | null = null;
	let sectionStart = 0;
	let sectionSubtotal = 0;

	for (let i = 0; i < items.length; i++) {
		const sec = assignments[i];
		if (sec !== currentSection && currentSection !== null) {
			// Close previous section
			const label = sectionKeywords.find((s) => s.section === currentSection)?.label ?? currentSection ?? "";
			breaks.push({
				afterIndex: i,
				section: currentSection,
				label,
				subtotal: sectionSubtotal,
			});
			sectionSubtotal = 0;
			sectionStart = i;
		}
		if (sec !== null) {
			currentSection = sec;
		}
		sectionSubtotal += Number(items[i].totalPrice);
	}

	// Close last section
	if (currentSection !== null && sectionStart < items.length) {
		const label = sectionKeywords.find((s) => s.section === currentSection)?.label ?? currentSection;
		breaks.push({
			afterIndex: items.length,
			section: currentSection,
			label,
			subtotal: sectionSubtotal,
		});
	}

	// Only use auto-detection if we found at least 2 distinct sections
	const uniqueSections = new Set(breaks.map((b) => b.section));
	if (uniqueSections.size < 2) return [];

	return breaks;
}

// ────────────────────────────────────────────────────────────────
// Number to Arabic words converter
// ────────────────────────────────────────────────────────────────

function numberToArabicWords(num: number): string {
	if (num === 0) return "صفر";

	const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
	const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
	const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
	const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

	const integer = Math.floor(Math.abs(num));
	if (integer === 0) return "صفر";

	const parts: string[] = [];

	// Millions
	const millions = Math.floor(integer / 1_000_000);
	if (millions > 0) {
		if (millions === 1) parts.push("مليون");
		else if (millions === 2) parts.push("مليونان");
		else if (millions >= 3 && millions <= 10) parts.push(`${ones[millions]} ملايين`);
		else parts.push(`${convertHundreds(millions)} مليون`);
	}

	// Thousands
	const thousands = Math.floor((integer % 1_000_000) / 1000);
	if (thousands > 0) {
		if (thousands === 1) parts.push("ألف");
		else if (thousands === 2) parts.push("ألفان");
		else if (thousands >= 3 && thousands <= 10) parts.push(`${ones[thousands]} آلاف`);
		else parts.push(`${convertHundreds(thousands)} ألفاً`);
	}

	// Remainder
	const remainder = integer % 1000;
	if (remainder > 0) {
		parts.push(convertHundreds(remainder));
	}

	return parts.filter(Boolean).join(" و");

	function convertHundreds(n: number): string {
		const h = Math.floor(n / 100);
		const t = n % 100;
		const result: string[] = [];

		if (h > 0) result.push(hundreds[h]);

		if (t >= 10 && t <= 19) {
			result.push(teens[t - 10]);
		} else {
			const o = t % 10;
			const d = Math.floor(t / 10);
			if (o > 0) result.push(ones[o]);
			if (d > 0) result.push(tens[d]);
		}

		return result.filter(Boolean).join(" و");
	}
}
