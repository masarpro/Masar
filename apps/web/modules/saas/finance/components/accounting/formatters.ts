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
	ASSET: { bg: "bg-chart-3/10", text: "text-chart-3" },
	LIABILITY: { bg: "bg-destructive/10", text: "text-destructive" },
	EQUITY: { bg: "bg-chart-4/10", text: "text-chart-4" },
	REVENUE: { bg: "bg-success/10", text: "text-success" },
	EXPENSE: { bg: "bg-chart-1/10", text: "text-chart-1" },
};
