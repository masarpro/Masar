/**
 * Platform chart palette — the ONLY sanctioned colors for Recharts.
 *
 * Values are CSS variables defined in tooling/tailwind/theme.css, so charts
 * automatically follow theme/dark-mode. Tokens are hex — use `var(--x)`
 * directly, NEVER `hsl(var(--x))` (invalid CSS, renders no color).
 */

/** Ordered categorical palette (series 1..n cycle through these).
 *  Botly Brand/01..05 as of the Botly redesign. */
export const CHART_PALETTE = [
	"var(--chart-1)", // Botly Brand/01 — yellow #ffcc6f
	"var(--chart-2)", // Botly Brand/02 — coral #ea7465
	"var(--chart-3)", // Botly Brand/03 — light blue #8ec9db
	"var(--chart-4)", // Botly Brand/04 — indigo #5d74f1
	"var(--chart-5)", // Botly Brand/05 — green #349264
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
