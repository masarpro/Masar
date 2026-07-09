/**
 * Platform chart palette — the ONLY sanctioned colors for Recharts.
 *
 * Values are CSS variables defined in tooling/tailwind/theme.css, so charts
 * automatically follow theme/dark-mode. Tokens are hex — use `var(--x)`
 * directly, NEVER `hsl(var(--x))` (invalid CSS, renders no color).
 */

/** Ordered categorical palette (series 1..n cycle through these). */
export const CHART_PALETTE = [
	"var(--chart-1)", // sky
	"var(--chart-2)", // violet
	"var(--chart-3)", // amber
	"var(--chart-4)", // red
	"var(--chart-5)", // cyan
] as const;

/** Semantic chart colors for value-laden series. */
export const CHART_SEMANTIC = {
	primary: "var(--primary)",
	positive: "var(--success)",
	negative: "var(--destructive)",
	neutral: "var(--muted-foreground)",
} as const;

/** Color for the i-th series of a categorical chart. */
export function chartColor(index: number): string {
	return CHART_PALETTE[index % CHART_PALETTE.length];
}
