/**
 * Decimal → Number conversion helpers for Prisma Decimal fields.
 * Prisma returns Decimal objects for @db.Decimal columns — these must be
 * converted to plain numbers before JSON serialization.
 */

// ═══════════════════════════════════════════════════════════════
// Base converters
// ═══════════════════════════════════════════════════════════════

/** Convert any Decimal-ish value to number (defaults to 0) */
export function toNum(value: unknown): number {
	if (value == null) return 0;
	return Number(value);
}

/** Convert nullable Decimal to number | null */
export function toNumOrNull(value: unknown): number | null {
	if (value == null) return null;
	return Number(value);
}

// ═══════════════════════════════════════════════════════════════
// CostStudy — 10 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertStudyDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(study: T) {
	return {
		...study,
		landArea: toNum(study.landArea),
		buildingArea: toNum(study.buildingArea),
		structuralCost: toNum(study.structuralCost),
		finishingCost: toNum(study.finishingCost),
		mepCost: toNum(study.mepCost),
		laborCost: toNum(study.laborCost),
		overheadPercent: toNum(study.overheadPercent),
		profitPercent: toNum(study.profitPercent),
		contingencyPercent: toNum(study.contingencyPercent),
		totalCost: toNum(study.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// StructuralItem — 8 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertStructuralItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		quantity: toNum(item.quantity),
		concreteVolume: toNumOrNull(item.concreteVolume),
		steelWeight: toNumOrNull(item.steelWeight),
		steelRatio: toNumOrNull(item.steelRatio),
		wastagePercent: toNum(item.wastagePercent),
		materialCost: toNum(item.materialCost),
		laborCost: toNum(item.laborCost),
		totalCost: toNum(item.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// FinishingItem — 12 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertFinishingItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		area: toNumOrNull(item.area),
		length: toNumOrNull(item.length),
		height: toNumOrNull(item.height),
		width: toNumOrNull(item.width),
		perimeter: toNumOrNull(item.perimeter),
		quantity: toNumOrNull(item.quantity),
		wastagePercent: toNumOrNull(item.wastagePercent),
		materialPrice: toNumOrNull(item.materialPrice),
		laborPrice: toNumOrNull(item.laborPrice),
		materialCost: toNum(item.materialCost),
		laborCost: toNum(item.laborCost),
		totalCost: toNum(item.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// MEPItem — 10 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertMEPItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		quantity: toNum(item.quantity),
		length: toNumOrNull(item.length),
		area: toNumOrNull(item.area),
		wastagePercent: toNum(item.wastagePercent),
		materialPrice: toNum(item.materialPrice),
		laborPrice: toNum(item.laborPrice),
		materialCost: toNum(item.materialCost),
		laborCost: toNum(item.laborCost),
		unitPrice: toNum(item.unitPrice),
		totalCost: toNum(item.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// LaborItem — 5 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertLaborItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		dailyRate: toNum(item.dailyRate),
		insuranceCost: toNum(item.insuranceCost),
		housingCost: toNum(item.housingCost),
		otherCosts: toNum(item.otherCosts),
		totalCost: toNum(item.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// Quote — 5 Decimal fields
// ═══════════════════════════════════════════════════════════════

export function convertQuoteDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(quote: T) {
	return {
		...quote,
		subtotal: toNum(quote.subtotal),
		overheadAmount: toNum(quote.overheadAmount),
		profitAmount: toNum(quote.profitAmount),
		vatAmount: toNum(quote.vatAmount),
		totalAmount: toNum(quote.totalAmount),
	};
}

// ═══════════════════════════════════════════════════════════════
// CostingItem — 11 Decimal fields (many nullable)
// ═══════════════════════════════════════════════════════════════

export function convertCostingItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		quantity: toNum(item.quantity),
		materialUnitCost: toNumOrNull(item.materialUnitCost),
		materialTotal: toNumOrNull(item.materialTotal),
		laborUnitCost: toNumOrNull(item.laborUnitCost),
		laborQuantity: toNumOrNull(item.laborQuantity),
		laborSalary: toNumOrNull(item.laborSalary),
		laborTotal: toNumOrNull(item.laborTotal),
		storageCostPercent: toNumOrNull(item.storageCostPercent),
		storageCostFixed: toNumOrNull(item.storageCostFixed),
		storageTotal: toNumOrNull(item.storageTotal),
		otherCosts: toNumOrNull(item.otherCosts),
		totalCost: toNumOrNull(item.totalCost),
	};
}

// ═══════════════════════════════════════════════════════════════
// ManualItem — 1 Decimal field
// ═══════════════════════════════════════════════════════════════

export function convertManualItemDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(item: T) {
	return {
		...item,
		quantity: toNum(item.quantity),
	};
}

// ═══════════════════════════════════════════════════════════════
// SectionMarkup — 1 Decimal field
// ═══════════════════════════════════════════════════════════════

export function convertSectionMarkupDecimals// eslint-disable-next-line @typescript-eslint/no-explicit-any
<T extends Record<string, any>>(markup: T) {
	return {
		...markup,
		markupPercent: toNum(markup.markupPercent),
	};
}
