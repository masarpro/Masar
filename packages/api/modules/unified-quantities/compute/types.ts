// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Compute Types
// أنواع محرك حساب الكميات (loose types — accept Prisma Decimal as
// number | string | null via duck typing)
// ════════════════════════════════════════════════════════════════

export type CalculationMethod =
	| "direct_area"
	| "length_x_height"
	| "length_only"
	| "per_unit"
	| "per_room"
	| "polygon"
	| "manual"
	| "lump_sum";

export type LinkFormula = "SAME" | "MINUS_WET_AREAS" | "PLUS_PERCENT";

/** Decimal-like — يقبل Prisma Decimal (string)، Number، أو null */
export type DecimalLike = number | string | null | undefined;

export interface ComputeItemInput {
	calculationMethod: CalculationMethod | string;
	unit?: string;
	primaryValue?: DecimalLike;
	secondaryValue?: DecimalLike;
	tertiaryValue?: DecimalLike;
	wastagePercent?: DecimalLike;
	deductOpenings?: boolean | null;
	polygonPoints?: unknown;
	linkedFromItemId?: string | null;
	linkQuantityFormula?: LinkFormula | string | null;
	linkPercentValue?: DecimalLike;
}

export interface ComputeContextOpening {
	computedArea: DecimalLike;
	count: number;
	isExterior?: boolean | null;
	deductFromInteriorFinishes?: boolean | null;
}

export interface ComputeContextSpace {
	isWetArea?: boolean | null;
	computedFloorArea?: DecimalLike;
	computedWallArea?: DecimalLike;
	floorArea?: DecimalLike;
	wallPerimeter?: DecimalLike;
}

export interface ComputeContext {
	totalFloorArea?: DecimalLike;
	totalWallArea?: DecimalLike;
	totalExteriorWallArea?: DecimalLike;
	totalRoofArea?: DecimalLike;
	totalPerimeter?: DecimalLike;
	averageFloorHeight?: DecimalLike;
	yardArea?: DecimalLike;
	fenceLength?: DecimalLike;
	spaces?: ComputeContextSpace[];
	openings?: ComputeContextOpening[];
}

export interface ComputeLinkedItem {
	effectiveQuantity?: DecimalLike;
	computedQuantity?: DecimalLike;
	unit?: string;
}

export interface ComputeInput {
	item: ComputeItemInput;
	context?: ComputeContext | null;
	openings?: ComputeContextOpening[];
	linkedFromItem?: ComputeLinkedItem | null;
}

export interface ComputeBreakdown {
	type: string;
	formula: string;
	steps: string[];
}

export interface ComputeOutput {
	computedQuantity: number; // قبل الهدر، بعد خصم الفتحات
	effectiveQuantity: number; // بعد الهدر
	openingsArea: number; // المساحة المخصومة (0 لو لا خصم)
	breakdown: ComputeBreakdown;
	warnings: string[];
}

// ── Helpers ──────────────────────────────────────────────────────

/** يحوّل DecimalLike إلى رقم. القيم المفقودة → fallback. NaN → fallback. */
export function num(value: DecimalLike, fallback = 0): number {
	if (value === null || value === undefined) return fallback;
	const n = typeof value === "string" ? Number(value) : value;
	return Number.isFinite(n) ? n : fallback;
}

/** يقرّب رقم إلى عدد محدد من المنازل العشرية (افتراضي: 4) */
export function round(n: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(n * factor) / factor;
}
