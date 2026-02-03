/**
 * Shared formatting utilities for the Masar application
 * Use these functions instead of duplicating formatting logic across components
 */

export type SupportedCurrency = "SAR" | "USD" | "EUR" | "AED" | "KWD" | "QAR" | "BHD" | "OMR";
export type SupportedLocale = "ar-SA" | "en-US" | "ar-EG" | "ar-AE";

/**
 * Format a number as currency
 * @param value - The numeric value to format (number, string, or null/undefined)
 * @param currency - The currency code (default: "SAR")
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted currency string
 */
export function formatCurrency(
	value: number | string | null | undefined,
	currency: SupportedCurrency = "SAR",
	locale: SupportedLocale = "ar-SA",
): string {
	if (value === null || value === undefined) {
		return "-";
	}

	const num = typeof value === "string" ? parseFloat(value) : value;

	if (isNaN(num)) {
		return "-";
	}

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
}

/**
 * Format a number as compact currency (e.g., 1.5M SAR)
 * @param value - The numeric value to format
 * @param currency - The currency code (default: "SAR")
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(
	value: number | string | null | undefined,
	currency: SupportedCurrency = "SAR",
	locale: SupportedLocale = "ar-SA",
): string {
	if (value === null || value === undefined) {
		return "-";
	}

	const num = typeof value === "string" ? parseFloat(value) : value;

	if (isNaN(num)) {
		return "-";
	}

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		notation: "compact",
		compactDisplay: "short",
	}).format(num);
}

/**
 * Format a date for display
 * @param date - The date to format (Date object or string)
 * @param locale - The locale for formatting (default: "ar-SA")
 * @param options - Additional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
	date: Date | string | null | undefined,
	locale: SupportedLocale = "ar-SA",
	options?: Intl.DateTimeFormatOptions,
): string {
	if (!date) {
		return "-";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (isNaN(dateObj.getTime())) {
		return "-";
	}

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
		...options,
	};

	return dateObj.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format a date in short format (e.g., 15/01/2024)
 * @param date - The date to format
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted short date string
 */
export function formatDateShort(
	date: Date | string | null | undefined,
	locale: SupportedLocale = "ar-SA",
): string {
	return formatDate(date, locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

/**
 * Format a date with time
 * @param date - The date to format
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted date with time string
 */
export function formatDateTime(
	date: Date | string | null | undefined,
	locale: SupportedLocale = "ar-SA",
): string {
	return formatDate(date, locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to compare against now
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
	date: Date | string | null | undefined,
	locale: SupportedLocale = "ar-SA",
): string {
	if (!date) {
		return "-";
	}

	const dateObj = typeof date === "string" ? new Date(date) : date;

	if (isNaN(dateObj.getTime())) {
		return "-";
	}

	const now = new Date();
	const diffMs = dateObj.getTime() - now.getTime();
	const diffSecs = Math.round(diffMs / 1000);
	const diffMins = Math.round(diffSecs / 60);
	const diffHours = Math.round(diffMins / 60);
	const diffDays = Math.round(diffHours / 24);
	const diffWeeks = Math.round(diffDays / 7);
	const diffMonths = Math.round(diffDays / 30);
	const diffYears = Math.round(diffDays / 365);

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

	if (Math.abs(diffSecs) < 60) {
		return rtf.format(diffSecs, "second");
	} else if (Math.abs(diffMins) < 60) {
		return rtf.format(diffMins, "minute");
	} else if (Math.abs(diffHours) < 24) {
		return rtf.format(diffHours, "hour");
	} else if (Math.abs(diffDays) < 7) {
		return rtf.format(diffDays, "day");
	} else if (Math.abs(diffWeeks) < 4) {
		return rtf.format(diffWeeks, "week");
	} else if (Math.abs(diffMonths) < 12) {
		return rtf.format(diffMonths, "month");
	} else {
		return rtf.format(diffYears, "year");
	}
}

/**
 * Format a number
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted number string
 */
export function formatNumber(
	value: number | string | null | undefined,
	decimals: number = 2,
	locale: SupportedLocale = "ar-SA",
): string {
	if (value === null || value === undefined) {
		return "-";
	}

	const num = typeof value === "string" ? parseFloat(value) : value;

	if (isNaN(num)) {
		return "-";
	}

	return num.toLocaleString(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

/**
 * Format a percentage
 * @param value - The percentage value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted percentage string
 */
export function formatPercentage(
	value: number | string | null | undefined,
	decimals: number = 0,
	locale: SupportedLocale = "ar-SA",
): string {
	if (value === null || value === undefined) {
		return "-";
	}

	let num = typeof value === "string" ? parseFloat(value) : value;

	if (isNaN(num)) {
		return "-";
	}

	// If value is between 0 and 1, assume it's a decimal percentage
	if (num > 0 && num <= 1) {
		num = num * 100;
	}

	return new Intl.NumberFormat(locale, {
		style: "percent",
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(num / 100);
}

/**
 * Format file size in human-readable format
 * @param bytes - The size in bytes
 * @param locale - The locale for formatting (default: "ar-SA")
 * @returns Formatted file size string
 */
export function formatFileSize(
	bytes: number | null | undefined,
	locale: SupportedLocale = "ar-SA",
): string {
	if (bytes === null || bytes === undefined || bytes === 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const size = bytes / Math.pow(1024, i);

	return `${formatNumber(size, i > 0 ? 1 : 0, locale)} ${units[i]}`;
}

/**
 * Calculate days remaining until a date
 * @param endDate - The end date
 * @returns Number of days remaining (negative if past)
 */
export function calculateDaysRemaining(
	endDate: Date | string | null | undefined,
): number | null {
	if (!endDate) {
		return null;
	}

	const end = typeof endDate === "string" ? new Date(endDate) : endDate;

	if (isNaN(end.getTime())) {
		return null;
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	const diff = end.getTime() - today.getTime();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format days remaining with appropriate text
 * @param endDate - The end date
 * @param locale - The locale for output text
 * @returns Formatted string like "15 days remaining" or "3 days overdue"
 */
export function formatDaysRemaining(
	endDate: Date | string | null | undefined,
	locale: SupportedLocale = "ar-SA",
): string {
	const days = calculateDaysRemaining(endDate);

	if (days === null) {
		return "-";
	}

	const isArabic = locale.startsWith("ar");

	if (days === 0) {
		return isArabic ? "اليوم" : "Today";
	} else if (days === 1) {
		return isArabic ? "غداً" : "Tomorrow";
	} else if (days === -1) {
		return isArabic ? "أمس" : "Yesterday";
	} else if (days > 0) {
		return isArabic ? `${days} يوم متبقي` : `${days} days remaining`;
	} else {
		const absDays = Math.abs(days);
		return isArabic ? `متأخر ${absDays} يوم` : `${absDays} days overdue`;
	}
}
