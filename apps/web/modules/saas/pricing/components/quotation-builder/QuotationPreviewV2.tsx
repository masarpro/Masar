"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuotationPreviewV2Props {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

const FORMAT_LABELS: Record<string, string> = {
	DETAILED_BOQ: "تفصيلي (BOQ)",
	PER_SQM: "بالمتر المربع",
	LUMP_SUM: "مقطوعية",
	CUSTOM: "مخصص",
};

export function QuotationPreviewV2({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationPreviewV2Props) {
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

	const fmt = (n: number) =>
		Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

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
				<p className="text-muted-foreground">عرض السعر غير موجود</p>
				<Link href={basePath}>
					<Button variant="outline" className="mt-4 rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						رجوع
					</Button>
				</Link>
			</div>
		);
	}

	const displayConfig = (quotation as any).displayConfig;
	const format = displayConfig?.format ?? "DETAILED_BOQ";
	const items = quotation.items ?? [];
	const subtotal = Number(quotation.subtotal);
	const discountAmount = Number(quotation.discountAmount);
	const discountPercent = Number(quotation.discountPercent);
	const vatPercent = Number(quotation.vatPercent);
	const vatAmount = Number(quotation.vatAmount);
	const totalAmount = Number(quotation.totalAmount);
	const afterDiscount = subtotal - discountAmount;

	const handlePrint = () => window.print();

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
	const totalArea = displayConfig?.totalArea ? Number(displayConfig.totalArea) : 0;
	const pricePerSqm = displayConfig?.pricePerSqm ? Number(displayConfig.pricePerSqm) : 0;

	const colCount = [showItemNumber, showDescription, showSpecifications, showQuantity, showUnit, showUnitPrice, showItemTotal].filter(Boolean).length;

	return (
		<div className="space-y-4" dir="rtl">
			{/* Actions Bar */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={`${basePath}/${quotationId}`}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						رجوع
					</Button>
				</Link>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handlePrint} className="rounded-xl">
						<Printer className="h-4 w-4 me-2" />
						طباعة
					</Button>
					<Button className="rounded-xl">
						<Download className="h-4 w-4 me-2" />
						تصدير PDF
					</Button>
				</div>
			</div>

			{/* Preview Card */}
			<Card className="rounded-2xl max-w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:border-none">
				<CardContent className="p-8 print:p-6 space-y-6">
					{/* Header */}
					<div className="flex justify-between items-start border-b border-border pb-6">
						<div>
							{orgSettings?.logo && (
								<img src={orgSettings.logo} alt="" className="h-14 mb-2 object-contain" />
							)}
							<p className="font-bold text-lg">{orgSettings?.companyNameAr ?? ""}</p>
							{orgSettings?.address && (
								<p className="text-sm text-muted-foreground">{orgSettings.address}</p>
							)}
							{orgSettings?.phone && (
								<p className="text-sm text-muted-foreground">{orgSettings.phone}</p>
							)}
						</div>
						<div className="text-left space-y-1">
							<h2 className="text-2xl font-bold text-primary">عرض سعر</h2>
							<p className="text-sm">
								<span className="text-muted-foreground">رقم:</span>{" "}
								<span className="font-medium">{quotation.quotationNo}</span>
							</p>
							<p className="text-sm">
								<span className="text-muted-foreground">التاريخ:</span>{" "}
								<span className="font-medium">
									{new Date(quotation.createdAt).toLocaleDateString("ar-SA")}
								</span>
							</p>
							<p className="text-sm">
								<span className="text-muted-foreground">صالح حتى:</span>{" "}
								<span className="font-medium">
									{new Date(quotation.validUntil).toLocaleDateString("ar-SA")}
								</span>
							</p>
						</div>
					</div>

					{/* Client info */}
					<div className="rounded-lg bg-muted/30 p-4 space-y-1">
						<p className="text-sm">
							<span className="text-muted-foreground">العميل:</span>{" "}
							<span className="font-semibold">{quotation.clientName}</span>
						</p>
						{quotation.clientCompany && (
							<p className="text-sm">
								<span className="text-muted-foreground">الشركة:</span>{" "}
								{quotation.clientCompany}
							</p>
						)}
						{quotation.clientPhone && (
							<p className="text-sm">
								<span className="text-muted-foreground">الهاتف:</span>{" "}
								<span dir="ltr">{quotation.clientPhone}</span>
							</p>
						)}
						{quotation.clientTaxNumber && (
							<p className="text-sm">
								<span className="text-muted-foreground">الرقم الضريبي:</span>{" "}
								<span dir="ltr">{quotation.clientTaxNumber}</span>
							</p>
						)}
					</div>

					{/* Items Table */}
					{items.length > 0 && (
						<div className="rounded-lg border border-border overflow-hidden">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/40 text-muted-foreground">
										{showItemNumber && <th className="px-3 py-2.5 text-right font-medium w-10">#</th>}
										{showDescription && <th className="px-3 py-2.5 text-right font-medium">الوصف</th>}
										{showSpecifications && <th className="px-3 py-2.5 text-center font-medium">المواصفات</th>}
										{showQuantity && <th className="px-3 py-2.5 text-center font-medium">الكمية</th>}
										{showUnit && <th className="px-3 py-2.5 text-center font-medium">الوحدة</th>}
										{showUnitPrice && <th className="px-3 py-2.5 text-center font-medium">سعر الوحدة</th>}
										{showItemTotal && <th className="px-3 py-2.5 text-center font-medium">الإجمالي</th>}
									</tr>
								</thead>
								<tbody>
									{items.map((item, idx) => (
										<tr key={item.id} className="border-b last:border-0">
											{showItemNumber && <td className="px-3 py-2">{idx + 1}</td>}
											{showDescription && <td className="px-3 py-2">{item.description}</td>}
											{showSpecifications && <td className="px-3 py-2 text-center text-muted-foreground">—</td>}
											{showQuantity && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.quantity))}</td>}
											{showUnit && <td className="px-3 py-2 text-center">{item.unit ?? ""}</td>}
											{showUnitPrice && <td className="px-3 py-2 text-center" dir="ltr">{fmt(Number(item.unitPrice))}</td>}
											{showItemTotal && <td className="px-3 py-2 text-center font-medium" dir="ltr">{fmt(Number(item.totalPrice))}</td>}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Price per sqm */}
					{showPricePerSqm && totalArea > 0 && (
						<div className="rounded-lg bg-muted/30 p-4 space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">المساحة الإجمالية</span>
								<span dir="ltr">{fmt(totalArea)} م²</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">سعر المتر المربع</span>
								<span dir="ltr">{fmt(pricePerSqm)} ر.س/م²</span>
							</div>
						</div>
					)}

					{/* Totals */}
					<div className="space-y-2 text-sm border-t border-border pt-4">
						{showSubtotal && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">المجموع الفرعي</span>
								<span dir="ltr">{fmt(subtotal)} ر.س</span>
							</div>
						)}
						{showDiscount && discountAmount > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									الخصم {discountPercent > 0 ? `(${fmt(discountPercent)}%)` : ""}
								</span>
								<span className="text-red-500" dir="ltr">-{fmt(discountAmount)} ر.س</span>
							</div>
						)}
						{showDiscount && discountAmount > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">بعد الخصم</span>
								<span dir="ltr">{fmt(afterDiscount)} ر.س</span>
							</div>
						)}
						{showVAT && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									ضريبة القيمة المضافة ({vatPercent}%)
								</span>
								<span dir="ltr">{fmt(vatAmount)} ر.س</span>
							</div>
						)}
						{showGrandTotal && (
							<div className="flex justify-between border-t border-border pt-2 mt-2">
								<span className="font-bold text-base">الإجمالي النهائي</span>
								<span className="font-bold text-lg text-primary" dir="ltr">
									{fmt(totalAmount)} ر.س
								</span>
							</div>
						)}
						{showGrandTotal && (
							<div className="text-center text-muted-foreground text-xs mt-1">
								({numberToArabicWords(totalAmount)} ريال سعودي)
							</div>
						)}
					</div>

					{/* Terms */}
					{(quotation.paymentTerms || quotation.deliveryTerms || quotation.warrantyTerms || quotation.notes) && (
						<div className="border-t border-border pt-4 space-y-2 text-sm">
							<h4 className="font-semibold">الشروط والأحكام</h4>
							{quotation.paymentTerms && (
								<p><span className="text-muted-foreground">شروط الدفع:</span> {quotation.paymentTerms}</p>
							)}
							{quotation.deliveryTerms && (
								<p><span className="text-muted-foreground">مدة التنفيذ:</span> {quotation.deliveryTerms}</p>
							)}
							{quotation.warrantyTerms && (
								<p><span className="text-muted-foreground">الضمان:</span> {quotation.warrantyTerms}</p>
							)}
							{quotation.notes && (
								<p><span className="text-muted-foreground">ملاحظات:</span> {quotation.notes}</p>
							)}
						</div>
					)}

					{/* Footer */}
					{orgSettings?.thankYouMessage && (
						<div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
							{orgSettings.thankYouMessage}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Print styles */}
			<style jsx global>{`
				@media print {
					body * { visibility: hidden; }
					.print-container, .print-container * { visibility: visible; }
					.print-container { position: absolute; left: 0; top: 0; width: 100%; }
					.print\\:hidden { display: none !important; }
				}
			`}</style>
		</div>
	);
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
