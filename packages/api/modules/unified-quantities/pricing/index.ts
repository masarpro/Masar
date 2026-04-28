// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Pricing (barrel)
// ════════════════════════════════════════════════════════════════

export { calculatePricing } from "./pricing-calculator";
export { solvePricing } from "./bi-directional-solver";
export { applyVAT } from "./vat-applier";
export type { VATResult } from "./vat-applier";
export { aggregateItems, aggregateStudyTotals } from "./study-aggregator";

export type {
	MarkupMethod,
	PricingField,
	PricingCalculationInput,
	PricingCalculationOutput,
	BiDirectionalInput,
	BiDirectionalOutput,
	PricedItemSnapshot,
	StudyTotals,
} from "./types";

// Markup primitives
export { applyPercentageMarkup } from "./markup-methods/percentage";
export { applyFixedAmountMarkup } from "./markup-methods/fixed-amount";
export { applyManualPriceMarkup } from "./markup-methods/manual-price";
