export function formatCurrency(amount: number | string): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	if (isNaN(num)) return "0 ر.س";
	return num.toLocaleString("ar-SA") + " ر.س";
}

export function formatNumber(value: number | string, decimals = 2): string {
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "0";
	return num.toLocaleString("ar-SA", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

export function formatDate(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return "";
	return dateObj.toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function numberToArabicWords(num: number): string {
	const ones = [
		"",
		"واحد",
		"اثنان",
		"ثلاثة",
		"أربعة",
		"خمسة",
		"ستة",
		"سبعة",
		"ثمانية",
		"تسعة",
	];
	const tens = [
		"",
		"عشرة",
		"عشرون",
		"ثلاثون",
		"أربعون",
		"خمسون",
		"ستون",
		"سبعون",
		"ثمانون",
		"تسعون",
	];
	const hundreds = [
		"",
		"مائة",
		"مائتان",
		"ثلاثمائة",
		"أربعمائة",
		"خمسمائة",
		"ستمائة",
		"سبعمائة",
		"ثمانمائة",
		"تسعمائة",
	];

	if (num === 0) return "صفر";

	let result = "";

	// الملايين
	if (num >= 1000000) {
		const millions = Math.floor(num / 1000000);
		result +=
			millions === 1
				? "مليون"
				: millions === 2
					? "مليونان"
					: `${ones[millions]} ملايين`;
		num %= 1000000;
		if (num > 0) result += " و";
	}

	// الآلاف
	if (num >= 1000) {
		const thousands = Math.floor(num / 1000);
		result +=
			thousands === 1
				? "ألف"
				: thousands === 2
					? "ألفان"
					: `${ones[thousands]} آلاف`;
		num %= 1000;
		if (num > 0) result += " و";
	}

	// المئات
	if (num >= 100) {
		result += hundreds[Math.floor(num / 100)];
		num %= 100;
		if (num > 0) result += " و";
	}

	// العشرات والآحاد
	if (num >= 10) {
		const digit = num % 10;
		if (digit > 0) {
			result += ones[digit] + " و";
		}
		result += tens[Math.floor(num / 10)];
	} else if (num > 0) {
		result += ones[num];
	}

	return result;
}

export { cn } from "@ui/lib";

// ═══════════════════════════════════════════════════════════════
// Rebar Calculation Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Convert bars per meter to spacing in centimeters
 * @param barsPerMeter Number of bars per linear meter
 * @returns Spacing in centimeters
 */
export function barsPerMeterToSpacing(barsPerMeter: number): number {
	if (barsPerMeter <= 0) return 0;
	return Math.round(100 / barsPerMeter);
}

/**
 * Convert spacing in centimeters to bars per meter
 * @param spacingCm Spacing in centimeters
 * @returns Number of bars per linear meter
 */
export function spacingToBarsPerMeter(spacingCm: number): number {
	if (spacingCm <= 0) return 0;
	return Math.round(100 / spacingCm);
}

/**
 * Convert spacing in millimeters to bars per meter
 * @param spacingMm Spacing in millimeters
 * @returns Number of bars per linear meter
 */
export function spacingMmToBarsPerMeter(spacingMm: number): number {
	if (spacingMm <= 0) return 0;
	return Math.round(1000 / spacingMm);
}

/**
 * Format spacing for display from bars per meter
 * @param barsPerMeter Number of bars per meter
 * @returns Formatted string like "20 سم"
 */
export function formatSpacingFromBars(barsPerMeter: number): string {
	const spacing = barsPerMeterToSpacing(barsPerMeter);
	return `${spacing} سم`;
}

/**
 * Generate auto name for element based on prefix and existing count
 * @param prefix Arabic prefix for element type (ق, ع, ك, ب, etc.)
 * @param existingCount Number of existing elements of this type
 * @returns Generated name like "ق1", "ع2", etc.
 */
export function generateElementName(
	prefix: string,
	existingCount: number,
): string {
	return `${prefix}${existingCount + 1}`;
}

/**
 * Element name prefixes for auto-naming
 */
export const ELEMENT_PREFIXES = {
	foundations: "ق", // قاعدة
	columns: "ع", // عمود
	beams: "ك", // كمرة
	slabs: "س", // سقف
	ceilings: "س", // سقف (alias)
	groundBeams: "م", // ميدة
	neckColumns: "ر", // رقبة
	blocks: "بل", // بلوك
	stairs: "سل", // سلم
	plainConcrete: "خ", // خرسانة عادية
} as const;
