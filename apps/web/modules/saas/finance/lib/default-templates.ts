/**
 * Default Template Configurations for Quotations and Invoices
 * Universal Professional Template - Bilingual (Arabic/English)
 */

import type { ElementType } from "../components/templates/ComponentsPanel";

export interface TemplateElement {
	id: string;
	type: ElementType;
	enabled: boolean;
	order: number;
	settings: Record<string, unknown>;
}

export interface TemplateSettings {
	backgroundColor: string;
	primaryColor: string;
	secondaryColor?: string;
	fontFamily: string;
	fontSize: string;
	lineHeight: string;
	pageSize: "A4" | "Letter";
	orientation: "portrait" | "landscape";
	margins: string;
	vatPercent: number;
	currency: string;
}

export interface DefaultTemplateConfig {
	name: string;
	nameAr: string;
	nameEn: string;
	description: string;
	descriptionAr: string;
	descriptionEn: string;
	templateType: "QUOTATION" | "INVOICE";
	elements: TemplateElement[];
	settings: TemplateSettings;
}

/**
 * Default settings for all templates
 */
export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
	backgroundColor: "#ffffff",
	primaryColor: "#3b82f6",
	fontFamily: "Cairo",
	fontSize: "14px",
	lineHeight: "1.6",
	pageSize: "A4",
	orientation: "portrait",
	margins: "20mm",
	vatPercent: 15,
	currency: "SAR",
};

/**
 * Generate unique ID for template elements
 */
const generateId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Default elements for quotation template
 */
export const getQuotationElements = (): TemplateElement[] => [
	{
		id: generateId(),
		type: "header",
		enabled: true,
		order: 1,
		settings: {
			showLogo: true,
			showCompanyName: true,
			showAddress: true,
			showBilingualName: true,
			layout: "modern",
		},
	},
	{
		id: generateId(),
		type: "clientInfo",
		enabled: true,
		order: 2,
		settings: {
			showTaxNumber: true,
			showEmail: true,
			showPhone: true,
			showCompanyName: true,
		},
	},
	{
		id: generateId(),
		type: "itemsTable",
		enabled: true,
		order: 3,
		settings: {
			showQuantity: true,
			showUnit: true,
			showUnitPrice: true,
			showRowNumbers: true,
			alternatingColors: true,
		},
	},
	{
		id: generateId(),
		type: "totals",
		enabled: true,
		order: 4,
		settings: {
			showDiscount: true,
			showVat: true,
			showAmountInWords: true,
			highlightTotal: true,
		},
	},
	{
		id: generateId(),
		type: "terms",
		enabled: true,
		order: 5,
		settings: {
			showPaymentTerms: true,
			showDeliveryTerms: true,
			showWarrantyTerms: true,
			showValidityNote: true,
			validityDays: 30,
		},
	},
	{
		id: generateId(),
		type: "signature",
		enabled: true,
		order: 6,
		settings: {
			showDate: true,
			showStampArea: true,
			twoColumns: true,
		},
	},
	{
		id: generateId(),
		type: "bankDetails",
		enabled: true,
		order: 7,
		settings: {
			showBankName: true,
			showIban: true,
			showAccountName: true,
			showSwiftCode: false,
		},
	},
	{
		id: generateId(),
		type: "qrCode",
		enabled: true,
		order: 8,
		settings: {
			size: "medium",
			showZatcaCompliance: true,
		},
	},
	{
		id: generateId(),
		type: "footer",
		enabled: true,
		order: 9,
		settings: {
			showThankYouMessage: true,
			showYear: true,
		},
	},
];

/**
 * Default elements for invoice template
 */
export const getInvoiceElements = (): TemplateElement[] => [
	{
		id: generateId(),
		type: "header",
		enabled: true,
		order: 1,
		settings: {
			showLogo: true,
			showCompanyName: true,
			showAddress: true,
			showBilingualName: true,
			layout: "modern",
		},
	},
	{
		id: generateId(),
		type: "clientInfo",
		enabled: true,
		order: 2,
		settings: {
			showTaxNumber: true,
			showEmail: true,
			showPhone: true,
			showCompanyName: true,
		},
	},
	{
		id: generateId(),
		type: "itemsTable",
		enabled: true,
		order: 3,
		settings: {
			showQuantity: true,
			showUnit: true,
			showUnitPrice: true,
			showRowNumbers: true,
			alternatingColors: true,
		},
	},
	{
		id: generateId(),
		type: "totals",
		enabled: true,
		order: 4,
		settings: {
			showDiscount: true,
			showVat: true,
			showAmountInWords: true,
			highlightTotal: true,
		},
	},
	{
		id: generateId(),
		type: "bankDetails",
		enabled: true,
		order: 5,
		settings: {
			showBankName: true,
			showIban: true,
			showAccountName: true,
			showSwiftCode: false,
		},
	},
	{
		id: generateId(),
		type: "terms",
		enabled: true,
		order: 6,
		settings: {
			showPaymentTerms: true,
			showDeliveryTerms: false,
			showWarrantyTerms: false,
		},
	},
	{
		id: generateId(),
		type: "signature",
		enabled: true,
		order: 7,
		settings: {
			showDate: true,
			showStampArea: true,
			twoColumns: true,
		},
	},
	{
		id: generateId(),
		type: "qrCode",
		enabled: true,
		order: 8,
		settings: {
			size: "medium",
			showZatcaCompliance: true,
		},
	},
	{
		id: generateId(),
		type: "footer",
		enabled: true,
		order: 9,
		settings: {
			showThankYouMessage: true,
			showYear: true,
		},
	},
];

/**
 * Get universal quotation template configuration
 */
export function getUniversalQuotationTemplate(): DefaultTemplateConfig {
	return {
		name: "قالب عرض سعر مهني",
		nameAr: "قالب عرض سعر مهني",
		nameEn: "Professional Quotation Template",
		description: "قالب احترافي ثنائي اللغة مناسب للأعمال الدولية",
		descriptionAr: "قالب احترافي ثنائي اللغة مناسب للأعمال الدولية",
		descriptionEn: "Professional bilingual template suitable for international business",
		templateType: "QUOTATION",
		elements: getQuotationElements(),
		settings: { ...DEFAULT_TEMPLATE_SETTINGS },
	};
}

/**
 * Get universal invoice template configuration
 */
export function getUniversalInvoiceTemplate(): DefaultTemplateConfig {
	return {
		name: "قالب فاتورة مهني",
		nameAr: "قالب فاتورة مهني",
		nameEn: "Professional Invoice Template",
		description: "قالب فاتورة احترافي متوافق مع متطلبات هيئة الزكاة والضريبة",
		descriptionAr: "قالب فاتورة احترافي متوافق مع متطلبات هيئة الزكاة والضريبة",
		descriptionEn: "Professional invoice template compliant with ZATCA requirements",
		templateType: "INVOICE",
		elements: getInvoiceElements(),
		settings: { ...DEFAULT_TEMPLATE_SETTINGS },
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL INVOICE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Template 1: الكلاسيكي الفاخر — Classic Luxury
 * Elegant classic design with navy + gold accents
 */
export const INVOICE_TEMPLATE_CLASSIC_LUXURY: DefaultTemplateConfig = {
	name: "الكلاسيكي الفاخر",
	nameAr: "الكلاسيكي الفاخر",
	nameEn: "Classic Luxury",
	description: "تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية",
	descriptionAr:
		"تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية — مثالي للشركات التي تريد إظهار الفخامة والاحترافية",
	descriptionEn:
		"Elegant classic design with gold accents — perfect for companies wanting to project luxury and professionalism",
	templateType: "INVOICE",
	settings: {
		backgroundColor: "#ffffff",
		primaryColor: "#1a1a2e",
		secondaryColor: "#c9a84c",
		fontFamily: "Cairo",
		fontSize: "14px",
		lineHeight: "1.6",
		pageSize: "A4",
		orientation: "portrait",
		margins: "20mm",
		vatPercent: 15,
		currency: "SAR",
	},
	elements: [
		{
			id: "el_classic_header",
			type: "header",
			enabled: true,
			order: 1,
			settings: {
				showLogo: true,
				showCompanyName: true,
				showAddress: true,
				showBilingualName: true,
				showTaxNumber: true,
				showCrNumber: true,
				showPhone: true,
				showEmail: true,
				layout: "classic",
				accentStyle: "gradient-line",
				titleSize: "large",
				subtitleText: "TAX INVOICE",
				subtitleStyle: "gold-caps",
			},
		},
		{
			id: "el_classic_invoicemeta",
			type: "clientInfo",
			enabled: true,
			order: 2,
			settings: {
				showInvoiceNumber: true,
				showInvoiceType: true,
				showIssueDate: true,
				showDueDate: true,
				showStatus: true,
				showTaxNumber: true,
				showEmail: true,
				showPhone: true,
				showCompanyName: true,
				showAddress: true,
				layout: "bordered-right",
				clientBackground: "#f8f7f4",
				borderColor: "#c9a84c",
				labelStyle: "gold-small",
			},
		},
		{
			id: "el_classic_items",
			type: "itemsTable",
			enabled: true,
			order: 3,
			settings: {
				showRowNumbers: true,
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showTotal: true,
				alternatingColors: true,
				headerBackground: "#1a1a2e",
				headerTextColor: "#ffffff",
				alternateRowColor: "#fafaf8",
				rowNumberColor: "#c9a84c",
				borderRadius: "4px",
			},
		},
		{
			id: "el_classic_totals",
			type: "totals",
			enabled: true,
			order: 4,
			settings: {
				showDiscount: true,
				showVat: true,
				showAmountInWords: false,
				highlightTotal: true,
				totalBackground: "#1a1a2e",
				totalTextColor: "#ffffff",
				totalAmountColor: "#c9a84c",
				showPaidAmount: true,
				showRemainingAmount: true,
				paidColor: "#16a34a",
				remainingColor: "#dc2626",
				layout: "left-aligned",
				width: "220px",
			},
		},
		{
			id: "el_classic_bank",
			type: "bankDetails",
			enabled: true,
			order: 5,
			settings: {
				showBankName: true,
				showIban: true,
				showAccountName: true,
				layout: "card",
				background: "#f8f7f4",
				borderRadius: "6px",
			},
		},
		{
			id: "el_classic_terms",
			type: "terms",
			enabled: true,
			order: 6,
			settings: {
				showPaymentTerms: true,
				showDeliveryTerms: false,
				showWarrantyTerms: false,
				showNotes: true,
				layout: "card",
				background: "#f8f7f4",
				borderRadius: "6px",
			},
		},
		{
			id: "el_classic_qr",
			type: "qrCode",
			enabled: true,
			order: 7,
			settings: {
				size: "medium",
				showZatcaCompliance: true,
				showLabel: true,
				labelText: "رمز الفاتورة الضريبية",
				borderRadius: "6px",
				background: "#f0f0f0",
			},
		},
		{
			id: "el_classic_signature",
			type: "signature",
			enabled: true,
			order: 8,
			settings: {
				showDate: false,
				showStampArea: true,
				twoColumns: false,
				lineColor: "#1a1a2e",
				labelAr: "التوقيع والختم",
				labelEn: "",
			},
		},
		{
			id: "el_classic_footer",
			type: "footer",
			enabled: true,
			order: 9,
			settings: {
				showThankYouMessage: false,
				showYear: false,
				showCompanyInfo: true,
				showPageNumber: true,
				accentStyle: "gradient-line",
				textColor: "#aaaaaa",
			},
		},
	],
};

/**
 * Template 2: العصري البسيط — Modern Minimal
 * Clean modern design with orange sidebar accent
 */
export const INVOICE_TEMPLATE_MODERN_MINIMAL: DefaultTemplateConfig = {
	name: "العصري البسيط",
	nameAr: "العصري البسيط",
	nameEn: "Modern Minimal",
	description: "تصميم عصري بسيط مع شريط جانبي برتقالي",
	descriptionAr:
		"تصميم عصري نظيف مع شريط جانبي برتقالي — مثالي للشركات العصرية",
	descriptionEn:
		"Clean modern design with orange sidebar accent — perfect for contemporary businesses",
	templateType: "INVOICE",
	settings: {
		backgroundColor: "#ffffff",
		primaryColor: "#f97316",
		secondaryColor: "#0f172a",
		fontFamily: "Cairo",
		fontSize: "14px",
		lineHeight: "1.6",
		pageSize: "A4",
		orientation: "portrait",
		margins: "20mm",
		vatPercent: 15,
		currency: "SAR",
	},
	elements: [
		{
			id: "el_modern_header",
			type: "header",
			enabled: true,
			order: 1,
			settings: {
				showLogo: true,
				showCompanyName: true,
				showAddress: true,
				showBilingualName: true,
				showTaxNumber: true,
				showPhone: true,
				showEmail: true,
				layout: "modern",
				accentStyle: "sidebar",
				sidebarWidth: "6px",
				sidebarGradient:
					"linear-gradient(180deg, #f97316, #ea580c)",
				titleSize: "xlarge",
				showTypeBadge: true,
				typeBadgeBackground: "#fff7ed",
				typeBadgeColor: "#ea580c",
			},
		},
		{
			id: "el_modern_invoicemeta",
			type: "clientInfo",
			enabled: true,
			order: 2,
			settings: {
				showInvoiceNumber: true,
				showIssueDate: true,
				showDueDate: true,
				showTaxNumber: true,
				showEmail: false,
				showPhone: true,
				showCompanyName: true,
				showAddress: true,
				layout: "two-cards",
				invoiceCardBackground: "#fafafa",
				clientCardBackground: "#fff7ed",
				clientCardBorder: "3px solid #f97316",
				borderSide: "right",
				labelStyle: "orange-uppercase",
				borderRadius: "8px",
			},
		},
		{
			id: "el_modern_items",
			type: "itemsTable",
			enabled: true,
			order: 3,
			settings: {
				showRowNumbers: true,
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showTotal: true,
				alternatingColors: true,
				headerStyle: "underline",
				headerBorderColor: "#f97316",
				headerBorderWidth: "2px",
				headerTextColor: "#94a3b8",
				alternateRowColor: "#fafafa",
				rowNumberStyle: "circle",
				rowNumberBackground: "#fff7ed",
				rowNumberColor: "#f97316",
				borderSpacing: "3px",
			},
		},
		{
			id: "el_modern_totals",
			type: "totals",
			enabled: true,
			order: 4,
			settings: {
				showDiscount: true,
				showVat: true,
				showAmountInWords: false,
				highlightTotal: true,
				layout: "card",
				background: "#fafafa",
				borderRadius: "8px",
				totalBorderTop: "2px solid #f97316",
				totalFontSize: "13px",
				totalColor: "#f97316",
				showPaidAmount: true,
				showRemainingAmount: true,
				paidColor: "#16a34a",
				remainingColor: "#dc2626",
				width: "230px",
			},
		},
		{
			id: "el_modern_bank",
			type: "bankDetails",
			enabled: true,
			order: 5,
			settings: {
				showBankName: true,
				showIban: true,
				showAccountName: false,
				layout: "bordered",
				borderColor: "#f0f0f0",
				borderRadius: "6px",
			},
		},
		{
			id: "el_modern_terms",
			type: "terms",
			enabled: true,
			order: 6,
			settings: {
				showPaymentTerms: true,
				showDeliveryTerms: false,
				showWarrantyTerms: false,
				showNotes: false,
				layout: "bordered",
				borderColor: "#f0f0f0",
				borderRadius: "6px",
			},
		},
		{
			id: "el_modern_qr",
			type: "qrCode",
			enabled: true,
			order: 7,
			settings: {
				size: "small",
				showZatcaCompliance: false,
				borderRadius: "8px",
				borderStyle: "dashed",
				borderColor: "#e0e0e0",
				background: "#fafafa",
			},
		},
		{
			id: "el_modern_footer",
			type: "footer",
			enabled: true,
			order: 8,
			settings: {
				showThankYouMessage: true,
				thankYouText: "شكراً لتعاملكم معنا",
				showYear: false,
				showCompanyInfo: true,
				showPhone: true,
				showEmail: true,
				accentStyle: "bottom-bar",
				barColor: "#f97316",
				barHeight: "3px",
				textColor: "#cbd5e1",
				textAlign: "center",
			},
		},
	],
};

/**
 * Template 3: الاحترافي الجريء — Bold Professional
 * Bold design with dark header and green accents
 */
export const INVOICE_TEMPLATE_BOLD_PROFESSIONAL: DefaultTemplateConfig = {
	name: "الاحترافي الجريء",
	nameAr: "الاحترافي الجريء",
	nameEn: "Bold Professional",
	description: "تصميم جريء مع هيدر داكن ولمسات خضراء",
	descriptionAr:
		"تصميم جريء واحترافي مع هيدر داكن ولمسات خضراء — مثالي لشركات المقاولات",
	descriptionEn:
		"Bold professional design with dark header and green accents — perfect for construction companies",
	templateType: "INVOICE",
	settings: {
		backgroundColor: "#ffffff",
		primaryColor: "#10b981",
		secondaryColor: "#0f172a",
		fontFamily: "Cairo",
		fontSize: "14px",
		lineHeight: "1.6",
		pageSize: "A4",
		orientation: "portrait",
		margins: "20mm",
		vatPercent: 15,
		currency: "SAR",
	},
	elements: [
		{
			id: "el_bold_header",
			type: "header",
			enabled: true,
			order: 1,
			settings: {
				showLogo: true,
				showCompanyName: true,
				showAddress: true,
				showBilingualName: true,
				showTaxNumber: true,
				showPhone: true,
				layout: "dark-block",
				blockBackground:
					"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
				blockTextColor: "#ffffff",
				titleSize: "xlarge",
				subtitleText: "TAX INVOICE",
				subtitleColor: "#10b981",
				showInvoiceNumberBadge: true,
				badgeBackground: "rgba(16,185,129,0.15)",
				badgeColor: "#10b981",
			},
		},
		{
			id: "el_bold_metabar",
			type: "text",
			enabled: true,
			order: 2,
			settings: {
				layout: "info-bar",
				background: "#10b981",
				textColor: "#ffffff",
				fontSize: "9px",
				fields: ["invoiceType", "issueDate", "dueDate"],
				dividerStyle: "vertical-line",
				dividerColor: "rgba(255,255,255,0.3)",
				padding: "8px 28px",
			},
		},
		{
			id: "el_bold_client",
			type: "clientInfo",
			enabled: true,
			order: 3,
			settings: {
				showTaxNumber: true,
				showEmail: true,
				showPhone: true,
				showCompanyName: true,
				showAddress: true,
				layout: "highlight-card",
				background: "#f0fdf4",
				borderColor: "#bbf7d0",
				borderRadius: "8px",
				labelStyle: "green-dot",
				labelColor: "#10b981",
			},
		},
		{
			id: "el_bold_items",
			type: "itemsTable",
			enabled: true,
			order: 4,
			settings: {
				showRowNumbers: true,
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showTotal: true,
				alternatingColors: false,
				headerBackground: "#0f172a",
				headerTextColor: "#ffffff",
				rowNumberColor: "#10b981",
				rowBorderColor: "#f1f5f9",
				headerRowNumberColor: "#10b981",
				borderRadius: "6px",
			},
		},
		{
			id: "el_bold_totals",
			type: "totals",
			enabled: true,
			order: 5,
			settings: {
				showDiscount: true,
				showVat: true,
				showAmountInWords: false,
				highlightTotal: true,
				layout: "card",
				background: "#f8fafc",
				borderColor: "#e2e8f0",
				borderRadius: "10px",
				totalDivider: "gradient",
				totalDividerGradient:
					"linear-gradient(90deg, #10b981, #059669)",
				totalFontSize: "13px",
				totalColor: "#10b981",
				showPaidAmount: true,
				showRemainingAmount: true,
				paidColor: "#16a34a",
				remainingColor: "#ef4444",
				width: "220px",
			},
		},
		{
			id: "el_bold_bank",
			type: "bankDetails",
			enabled: true,
			order: 6,
			settings: {
				showBankName: true,
				showIban: true,
				showAccountName: false,
				layout: "inline",
				fontSize: "8px",
			},
		},
		{
			id: "el_bold_qr",
			type: "qrCode",
			enabled: true,
			order: 7,
			settings: {
				size: "medium",
				showZatcaCompliance: true,
				borderRadius: "10px",
				borderColor: "#e2e8f0",
				background: "#f8fafc",
				position: "left",
			},
		},
		{
			id: "el_bold_terms",
			type: "terms",
			enabled: true,
			order: 8,
			settings: {
				showPaymentTerms: true,
				showNotes: true,
				layout: "card",
				background: "#f8fafc",
				borderRadius: "6px",
			},
		},
		{
			id: "el_bold_signature",
			type: "signature",
			enabled: true,
			order: 9,
			settings: {
				showDate: false,
				showStampArea: true,
				twoColumns: false,
				lineColor: "#0f172a",
				lineWidth: "2px",
				labelAr: "التوقيع والختم",
				labelEn: "Authorized Signature",
				showBilingualLabel: true,
			},
		},
		{
			id: "el_bold_footer",
			type: "footer",
			enabled: true,
			order: 10,
			settings: {
				showThankYouMessage: false,
				showYear: false,
				showCompanyInfo: true,
				showPageNumber: true,
				layout: "dark-bar",
				background: "#0f172a",
				textColor: "#64748b",
				pageNumberColor: "#10b981",
			},
		},
	],
};

/**
 * Get all available invoice templates
 */
export function getAllInvoiceTemplates(): DefaultTemplateConfig[] {
	return [
		getUniversalInvoiceTemplate(),
		INVOICE_TEMPLATE_CLASSIC_LUXURY,
		INVOICE_TEMPLATE_MODERN_MINIMAL,
		INVOICE_TEMPLATE_BOLD_PROFESSIONAL,
	];
}

/**
 * Convert number to Arabic words (for Saudi Riyal)
 */
export function numberToArabicWords(amount: number): string {
	const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
	const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
	const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
	const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

	if (amount === 0) return "صفر";

	const parts: string[] = [];
	const intPart = Math.floor(amount);
	const decPart = Math.round((amount - intPart) * 100);

	// Handle thousands
	if (intPart >= 1000) {
		const thousands = Math.floor(intPart / 1000);
		if (thousands === 1) {
			parts.push("ألف");
		} else if (thousands === 2) {
			parts.push("ألفان");
		} else if (thousands <= 10) {
			parts.push(ones[thousands] + " آلاف");
		} else {
			parts.push(thousands.toString() + " ألف");
		}
	}

	// Handle hundreds
	const remainder = intPart % 1000;
	if (remainder >= 100) {
		const hundredIndex = Math.floor(remainder / 100);
		parts.push(hundreds[hundredIndex]);
	}

	// Handle tens and ones
	const tensAndOnes = remainder % 100;
	if (tensAndOnes > 0) {
		if (tensAndOnes >= 10 && tensAndOnes < 20) {
			parts.push(teens[tensAndOnes - 10]);
		} else {
			const onesDigit = tensAndOnes % 10;
			const tensDigit = Math.floor(tensAndOnes / 10);

			if (onesDigit > 0 && tensDigit > 0) {
				parts.push(ones[onesDigit] + " و" + tens[tensDigit]);
			} else if (onesDigit > 0) {
				parts.push(ones[onesDigit]);
			} else if (tensDigit > 0) {
				parts.push(tens[tensDigit]);
			}
		}
	}

	let result = parts.join(" و") + " ريال سعودي";

	// Handle halalas
	if (decPart > 0) {
		result += " و" + decPart.toString() + " هللة";
	}

	return result;
}

/**
 * Convert number to English words
 */
export function numberToEnglishWords(amount: number): string {
	const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
	const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
	const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

	if (amount === 0) return "zero";

	const intPart = Math.floor(amount);
	const decPart = Math.round((amount - intPart) * 100);

	const convertHundreds = (n: number): string => {
		if (n === 0) return "";
		if (n < 10) return ones[n];
		if (n < 20) return teens[n - 10];
		if (n < 100) {
			const ten = Math.floor(n / 10);
			const one = n % 10;
			return tens[ten] + (one ? "-" + ones[one] : "");
		}
		const hundred = Math.floor(n / 100);
		const remainder = n % 100;
		return ones[hundred] + " hundred" + (remainder ? " " + convertHundreds(remainder) : "");
	};

	const parts: string[] = [];

	if (intPart >= 1000000) {
		const millions = Math.floor(intPart / 1000000);
		parts.push(convertHundreds(millions) + " million");
	}

	const afterMillion = intPart % 1000000;
	if (afterMillion >= 1000) {
		const thousands = Math.floor(afterMillion / 1000);
		parts.push(convertHundreds(thousands) + " thousand");
	}

	const remainder = afterMillion % 1000;
	if (remainder > 0) {
		parts.push(convertHundreds(remainder));
	}

	let result = parts.join(" ") + " Saudi Riyals";

	if (decPart > 0) {
		result += " and " + decPart + " Halalas";
	}

	return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Get amount in words based on locale
 */
export function getAmountInWords(amount: number, locale: string): string {
	if (locale === "ar") {
		return numberToArabicWords(amount);
	}
	return numberToEnglishWords(amount);
}

/**
 * Available primary colors for templates
 */
export const TEMPLATE_COLORS = [
	{ value: "#3b82f6", label: "أزرق", labelEn: "Blue" },
	{ value: "#10b981", label: "أخضر", labelEn: "Green" },
	{ value: "#8b5cf6", label: "بنفسجي", labelEn: "Purple" },
	{ value: "#f59e0b", label: "برتقالي", labelEn: "Orange" },
	{ value: "#ef4444", label: "أحمر", labelEn: "Red" },
	{ value: "#06b6d4", label: "سماوي", labelEn: "Cyan" },
	{ value: "#1e293b", label: "رمادي داكن", labelEn: "Slate" },
];

/**
 * Available currencies
 */
export const TEMPLATE_CURRENCIES = [
	{ value: "SAR", label: "ريال سعودي", labelEn: "Saudi Riyal", symbol: "ر.س" },
	{ value: "AED", label: "درهم إماراتي", labelEn: "UAE Dirham", symbol: "د.إ" },
	{ value: "USD", label: "دولار أمريكي", labelEn: "US Dollar", symbol: "$" },
	{ value: "EUR", label: "يورو", labelEn: "Euro", symbol: "€" },
	{ value: "GBP", label: "جنيه إسترليني", labelEn: "British Pound", symbol: "£" },
	{ value: "KWD", label: "دينار كويتي", labelEn: "Kuwaiti Dinar", symbol: "د.ك" },
	{ value: "QAR", label: "ريال قطري", labelEn: "Qatari Riyal", symbol: "ر.ق" },
	{ value: "BHD", label: "دينار بحريني", labelEn: "Bahraini Dinar", symbol: "د.ب" },
	{ value: "OMR", label: "ريال عماني", labelEn: "Omani Rial", symbol: "ر.ع" },
];
