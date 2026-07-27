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
// Deep serializer — شبكة أمان لكل مخرجات الـ RPC
// ═══════════════════════════════════════════════════════════════

/**
 * هل القيمة كائن Prisma Decimal؟ فحص بالبنية لا بالاستيراد، فيبقى الملف
 * مستقلاً عن مسار توليد عميل Prisma ولا ينكسر بإعادة التوليد.
 * (decimal.js: s = الإشارة، e = الأس، d = مصفوفة الأرقام)
 */
function isDecimalLike(value: object): boolean {
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.toNumber === "function" &&
		typeof candidate.toFixed === "function" &&
		typeof candidate.s === "number" &&
		Array.isArray(candidate.d)
	);
}

/**
 * يحوّل كل كائنات Decimal داخل أي ناتج (مهما كان تعشيشه) إلى أرقام عادية.
 *
 * الدوال المسماة أعلاه تغطي حقولاً بعينها، وأي حقل Decimal جديد يُضاف إلى
 * الـ schema يفلت منها: عبر HTTP يصل كنص (toJSON) وعبر نداء SSR داخل
 * العملية يصل ككائن Decimal فتحذّر React أن الكائنات غير العادية لا تُمرَّر
 * لمكوّنات العميل. هذه الدالة تجعل المسارين يخرجان بأرقام دائماً.
 *
 * تُعيد المرجع نفسه حين لا يوجد ما يُحوَّل، فلا تخصيص ذاكرة بلا داعٍ.
 */
export function serializeDecimals<T>(value: T): T {
	return convertDeep(value) as T;
}

function convertDeep(value: unknown): unknown {
	if (value === null || typeof value !== "object") return value;

	if (isDecimalLike(value)) return Number(value);

	// أنواع تُترك كما هي — تسلسلها الخاص يتكفّل بها
	if (value instanceof Date) return value;
	if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return value;

	if (Array.isArray(value)) {
		let changed = false;
		const next = value.map((entry) => {
			const converted = convertDeep(entry);
			if (converted !== entry) changed = true;
			return converted;
		});
		return changed ? next : value;
	}

	// الكائنات العادية فقط — أي نسخة صنف (Map/Stream/مولّد) تمر بلا مساس
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) return value;

	let changed = false;
	const next: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value)) {
		const converted = convertDeep(entry);
		if (converted !== entry) changed = true;
		next[key] = converted;
	}
	return changed ? next : value;
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
