// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Pricing Types
// أنواع محرك التسعير: Forward (calculate) + Reverse (bi-directional solve)
// ════════════════════════════════════════════════════════════════

import type { DecimalLike } from "../compute/types";

export type MarkupMethod = "percentage" | "fixed_amount" | "manual_price";

/**
 * الحقول التي يمكن للمستخدم تعديلها في الـ UI، والتي يجب على
 * bi-directional solver أن يستنتج بقية القيم منها.
 */
export type PricingField =
	| "material_unit_price"
	| "labor_unit_price"
	| "markup_percent"
	| "markup_fixed_amount"
	| "manual_unit_price"
	| "sell_unit_price"
	| "sell_total_amount";

// ── Forward calculation ──────────────────────────────────────────

export interface PricingCalculationInput {
	effectiveQuantity: DecimalLike;
	materialUnitPrice?: DecimalLike;
	laborUnitPrice?: DecimalLike;
	markupMethod: MarkupMethod | string;
	markupPercent?: DecimalLike;
	markupFixedAmount?: DecimalLike;
	manualUnitPrice?: DecimalLike;
	/** نسبة الربح الافتراضية على مستوى الدراسة — تُستخدم حين hasCustomMarkup=false */
	globalMarkupPercent?: DecimalLike;
	/** هل البند له هامش خاص (true) أم يتبع Global Markup (false) */
	hasCustomMarkup: boolean;
}

export interface PricingCalculationOutput {
	// التكلفة
	materialCost: number;
	laborCost: number;
	totalCost: number;
	unitCost: number;

	// البيع
	sellUnitPrice: number;
	sellTotalAmount: number;

	// الربح
	profitAmount: number;
	/** نسبة الربح من البيع: (profit / sell) × 100 — هامش ربح */
	profitPercent: number;
	/** نسبة الربح من التكلفة: (profit / cost) × 100 — markup فعلي */
	actualMarkupPercent: number;

	// Metadata
	/** الطريقة التي طُبِّقت فعلياً (قد تختلف عن المُمرَّرة لو hasCustomMarkup=false) */
	effectiveMarkupMethod: MarkupMethod;
	breakdown: string[];
	warnings: string[];
}

// ── Reverse calculation (bi-directional) ─────────────────────────

export interface BiDirectionalInput {
	changedField: PricingField;
	newValue: DecimalLike;
	effectiveQuantity: DecimalLike;
	materialUnitPrice: DecimalLike;
	laborUnitPrice: DecimalLike;
	currentMarkupMethod: MarkupMethod | string;
	/** القيم الحالية للـ markup — تُستخدم حين الحقل المُعدَّل لا يخصّ markup */
	currentMarkupPercent?: DecimalLike;
	currentMarkupFixedAmount?: DecimalLike;
	currentManualUnitPrice?: DecimalLike;
	hasCustomMarkup: boolean;
	/** Global markup من الدراسة — fallback عند hasCustomMarkup=false وعدم وجود markupPercent حالي */
	globalMarkupPercent?: DecimalLike;
}

export interface BiDirectionalOutput {
	markupMethod: MarkupMethod;
	/** null لو الطريقة الحالية لا تستخدم هذا الحقل (مثلاً في manual_price يظل markupPercent ضمنياً للعرض) */
	markupPercent: number | null;
	markupFixedAmount: number | null;
	manualUnitPrice: number | null;

	materialUnitPrice: number;
	laborUnitPrice: number;
	sellUnitPrice: number;
	sellTotalAmount: number;
	profitAmount: number;
	profitPercent: number;

	hasCustomMarkup: boolean;
	warnings: string[];
}

// ── Aggregation ──────────────────────────────────────────────────

/**
 * بنود التسعير في صيغة pure (لا يعتمد على Prisma) — يُستخدم في
 * aggregateItems للحسابات الذرية القابلة للاختبار بدون DB.
 */
export interface PricedItemSnapshot {
	id?: string;
	isEnabled?: boolean;
	effectiveQuantity: DecimalLike;
	materialUnitPrice?: DecimalLike;
	laborUnitPrice?: DecimalLike;
	markupMethod: MarkupMethod | string;
	markupPercent?: DecimalLike;
	markupFixedAmount?: DecimalLike;
	manualUnitPrice?: DecimalLike;
	hasCustomMarkup: boolean;
}

export interface StudyTotals {
	totalMaterialCost: number;
	totalLaborCost: number;
	totalGrossCost: number;
	totalSellAmount: number;
	totalProfitAmount: number;
	totalProfitPercent: number;
	itemCount: number;
	enabledItemCount: number;
	vat: { netAmount: number; vatAmount: number; grossAmount: number };
}
