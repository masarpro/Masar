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
