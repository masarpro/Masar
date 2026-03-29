// Accounting number formatters — used across all financial reports

/**
 * Format a number in accounting style:
 * - Thousands separator: 500,000
 * - Negative in parentheses: (10,000)
 * - Zero returns empty string
 */
export function formatAccounting(amount: number): string {
	if (amount === 0 || amount === undefined || amount === null) return "";
	const abs = Math.abs(amount);
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(abs);
	return amount < 0 ? `(${formatted})` : formatted;
}

/**
 * Format a percentage value with 1 decimal place
 */
export function formatPercent(value: number): string {
	if (value === 0 || value === undefined || value === null) return "";
	return `${value.toFixed(1)}%`;
}

/**
 * Account type color classes
 */
export const ACCOUNT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
	ASSET: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-300" },
	LIABILITY: { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-300" },
	EQUITY: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-300" },
	REVENUE: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-300" },
	EXPENSE: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-300" },
};
