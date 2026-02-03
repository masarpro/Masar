/**
 * Format a number as currency with English numerals
 * Note: For displaying with Saudi Riyal symbol, use the Currency component
 * @see apps/web/modules/saas/finance/components/shared/Currency.tsx
 */
export function formatCurrency(amount: number): string {
	const formatted = new Intl.NumberFormat("en-SA", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
	return formatted;
}

/**
 * Format a number with English numerals
 */
export function formatNumber(num: number | null | undefined): string {
	if (num == null) return "0";
	return new Intl.NumberFormat("en-SA").format(num);
}

/**
 * Format a date for display with English numerals
 */
export function formatDate(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

/**
 * Format a date with Arabic month names but English numerals
 */
export function formatDateArabic(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;

	const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

	const day = d.getDate();
	const month = months[d.getMonth()];
	const year = d.getFullYear();

	return `${day} ${month} ${year}`;
}

/**
 * Format a date with weekday in Arabic text but English numerals
 */
export function formatDateFull(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;

	const weekdays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
	const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

	const weekday = weekdays[d.getDay()];
	const day = d.getDate();
	const month = months[d.getMonth()];
	const year = d.getFullYear();

	return `${weekday} ${day} ${month} ${year}`;
}

/**
 * Format Hijri date with English numerals
 */
export function formatHijriDate(date: Date | null | undefined): string {
	if (!date) return "";

	// Get Hijri date parts
	const hijriFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const parts = hijriFormatter.formatToParts(date);
	const day = parts.find(p => p.type === "day")?.value || "";
	const month = parts.find(p => p.type === "month")?.value || "";
	const year = parts.find(p => p.type === "year")?.value || "";

	// Convert Arabic numerals to English
	const toEnglishNumerals = (str: string) =>
		str.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

	return `${toEnglishNumerals(day)} ${month} ${toEnglishNumerals(year)}`;
}

/**
 * Format time with English numerals
 */
export function formatTime(date: Date | null | undefined): string {
	if (!date) return "";
	return date.toLocaleTimeString("en-SA", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

/**
 * Format a date with time for display with English numerals
 */
export function formatDateTime(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;

	const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

	const day = d.getDate();
	const month = months[d.getMonth()];
	const year = d.getFullYear();
	const time = d.toLocaleTimeString("en-SA", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});

	return `${day} ${month} ${year} - ${time}`;
}

/**
 * Format percentage with English numerals
 */
export function formatPercent(value: number | null | undefined): string {
	if (value == null) return "0%";
	return `${new Intl.NumberFormat("en-SA", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	}).format(value)}%`;
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
	const d1 = typeof date1 === "string" ? new Date(date1) : date1;
	const d2 = typeof date2 === "string" ? new Date(date2) : date2;
	const diffTime = Math.abs(d2.getTime() - d1.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
	const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
	return d < new Date();
}

/**
 * Calculate totals from items
 */
export function calculateTotals(
	items: Array<{ quantity: number; unitPrice: number }>,
	discountPercent = 0,
	vatPercent = 15,
) {
	const subtotal = items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	);
	const discountAmount = (subtotal * discountPercent) / 100;
	const afterDiscount = subtotal - discountAmount;
	const vatAmount = (afterDiscount * vatPercent) / 100;
	const totalAmount = afterDiscount + vatAmount;

	return {
		subtotal,
		discountAmount,
		afterDiscount,
		vatAmount,
		totalAmount,
	};
}
