// ═══════════════════════════════════════════════════════════════════════════
// تقرير التكلفة والتسعير — تجميع نقي (بلا React)
// ───────────────────────────────────────────────────────────────────────────
// يبني تقريراً شاملاً للدراسة: كميات وأسعار وإجماليات لكل بند، موزّعة على
// الأدوار، ثم المصنعيات والتشوين والمصاريف غير المباشرة، وينتهي بملخص
// التكلفة والتسعير والأرباح.
//
// مصدر الأرقام:
//   • التفاصيل (كميات × أسعار) تُحسب هنا من البنود الإنشائية + الأسعار
//     المحفوظة في laborBreakdown — بنفس منطق تبويب «المواد».
//   • الإجماليات النهائية تُؤخذ من الخادم (costing.getSummary و
//     markup.getProfitAnalysis) لأنها المرجع المعتمد في ملخص التكلفة
//     وعرض السعر. الفارق بينهما يعني أن تبويب المواد لم يُحفظ بعد.
// ═══════════════════════════════════════════════════════════════════════════

import {
	aggregateBOQ,
	buildFloorFilterOptions,
	getItemFloorGroup,
	REBAR_WEIGHTS_MAP,
	SECTION_LABELS,
	type StructuralItem,
} from "./boq-aggregator";
import { recalculateItem, type RecalcResult } from "./boq-recalculator";
import {
	blockGroupLabel,
	deriveBlockMaterials,
	type BlockMaterials,
} from "./block-materials";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface EnabledFloor {
	id: string;
	label: string;
	icon?: string;
	sortOrder: number;
}

/** الأسعار المحفوظة في CostStudy.laborBreakdown */
export interface MaterialPrices {
	concretePrices: Record<string, number>;
	steelPriceD6: number;
	steelPriceD8: number;
	steelPriceMain: number;
	/** سعر طن الحديد المعزول (إيبوكسي) — يُطبَّق على حديد الأساسات فقط */
	steelPriceIsolated: number;
	/** مفعّل من مواصفات الأعمال الإنشائية (structuralSpecs.hasIsolatedSteel) */
	hasIsolatedSteel: boolean;
	blockPrices: Record<string, number>;
	mortarSandPrice: number;
	mortarCementPrice: number;
	lintelConcretePrice: number;
	lintelSteelPrice: number;
	storagePercent: number;
}

/** تسمية موحّدة لصف/مجموعة حديد الأساسات المعزول */
export const ISOLATED_STEEL_LABEL = "حديد الأساسات معزول (إيبوكسي)";

/**
 * حديد الأساسات — النطاق الذي يُغطّيه الحديد المعزول (إيبوكسي):
 * القواعد والميدة ورقاب الأعمدة، وهو نفس ما تعرضه شاشة المواصفات.
 */
export function isIsolatedSteelItem(item: {
	category?: string | null;
	subCategory?: string | null;
}): boolean {
	const category = item.category ?? "";
	const subCategory = item.subCategory ?? "";
	if (category === "foundations") return true;
	if (category === "beams" && subCategory === "groundBeam") return true;
	if (category === "columns") {
		return subCategory.endsWith("_neck") || subCategory === "neck";
	}
	return false;
}

export interface CostReportRow {
	key: string;
	label: string;
	/** الدور أو التصنيف الفرعي */
	detail?: string;
	quantity: number;
	unit: string;
	unitPrice: number;
	total: number;
}

export interface CostReportGroup {
	key: string;
	label: string;
	unit: string;
	rows: CostReportRow[];
	totalQuantity: number;
	total: number;
}

export interface CostReportSection {
	key: string;
	label: string;
	icon: string;
	groups: CostReportGroup[];
	total: number;
}

export interface CostReportSummaryRow {
	key: string;
	label: string;
	total: number;
	/** نسبة من الإجمالي العام */
	percent: number;
}

export interface CostReportPricing {
	totalCost: number;
	overheadAmount: number;
	profitAmount: number;
	contingencyAmount: number;
	sellingPriceBeforeVat: number;
	vatAmount: number;
	grandTotal: number;
	profitPercent: number;
	costPerSqm: number;
	pricePerSqm: number;
	buildingArea: number;
}

export interface CostReport {
	/** جداول المواد التفصيلية (خرسانة / حديد / بلوك / مونة / أعتاب) */
	materialSections: CostReportSection[];
	/** الأسعار المعتمدة كما أدخلها المستخدم */
	unitPriceRows: CostReportRow[];
	materialTotalComputed: number;
	/** المصنعيات — تفصيل من laborBreakdown + أقسام أخرى من الخادم */
	laborSection: CostReportSection;
	/** التشوين والمصاريف الأخرى */
	storageSection: CostReportSection;
	/** المصاريف غير المباشرة (سلك ومسمار، إشراف، تشغيل) */
	indirectSection: CostReportSection;
	/** الملخص النهائي — من الخادم */
	summaryRows: CostReportSummaryRow[];
	grandTotal: number;
	pricing: CostReportPricing | null;
	/** فرق التفاصيل عن الملخص المعتمد (يعني: احفظ تبويب المواد) */
	materialDrift: number;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const num = (v: unknown): number => {
	const n = Number(v ?? 0);
	return Number.isFinite(n) ? n : 0;
};

/**
 * يقرأ الأسعار من laborBreakdown مع قيم افتراضية آمنة.
 * `hasIsolatedSteel` يأتي من مواصفات الأعمال الإنشائية — يُمرَّر صراحةً عند
 * توفّره، وإلا يُقرأ من النسخة المحفوظة داخل laborBreakdown عند آخر حفظ.
 */
export function readMaterialPrices(
	breakdown: unknown,
	hasIsolatedSteel?: boolean,
): MaterialPrices {
	const bd = (breakdown ?? {}) as Record<string, any>;

	const concretePrices: Record<string, number> = {};
	if (bd.concretePrices && typeof bd.concretePrices === "object") {
		for (const [k, v] of Object.entries(bd.concretePrices)) {
			concretePrices[k] = num(v);
		}
	}

	const blockPrices: Record<string, number> = {};
	if (bd.blockPrices && typeof bd.blockPrices === "object") {
		for (const [k, v] of Object.entries(bd.blockPrices)) {
			blockPrices[k] = num(v);
		}
	}

	// توافق خلفي: سعر خرسانة واحد قديم يُطبَّق على كل الرتب
	const legacyConcrete = num(bd.concretePrice);
	const legacySteel = num(bd.steelPrice);

	return {
		concretePrices,
		steelPriceD6: bd.steelPriceD6 != null ? num(bd.steelPriceD6) : legacySteel,
		steelPriceD8: bd.steelPriceD8 != null ? num(bd.steelPriceD8) : legacySteel,
		steelPriceMain:
			bd.steelPriceMain != null ? num(bd.steelPriceMain) : legacySteel,
		steelPriceIsolated: num(bd.steelPriceIsolated),
		hasIsolatedSteel: hasIsolatedSteel ?? !!bd.hasIsolatedSteel,
		blockPrices,
		mortarSandPrice: num(bd.mortarSandPrice),
		mortarCementPrice: num(bd.mortarCementPrice),
		lintelConcretePrice: num(bd.lintelConcretePrice),
		lintelSteelPrice: num(bd.lintelSteelPrice),
		storagePercent: num(bd.storagePercent),
		...(Object.keys(concretePrices).length === 0 && legacyConcrete > 0
			? { concretePrices: { C30: legacyConcrete } }
			: {}),
	};
}

function steelPriceFor(
	diameter: number,
	prices: MaterialPrices,
	isolated = false,
): number {
	// حديد الأساسات المعزول يُشترى بسعر واحد بغض النظر عن القطر
	if (isolated && prices.hasIsolatedSteel) return prices.steelPriceIsolated;
	if (diameter <= 6) return prices.steelPriceD6;
	if (diameter <= 8) return prices.steelPriceD8;
	return prices.steelPriceMain;
}

// ═══════════════════════════════════════════════════════════════
// تكلفة مواد بند واحد
// ═══════════════════════════════════════════════════════════════

export interface ItemMaterialCost {
	concreteVolume: number;
	concreteCost: number;
	concreteGrade: string;
	steelTons: number;
	steelCost: number;
	blockCount: number;
	blockCost: number;
	blockKey: string;
	sandVolume: number;
	cementBags: number;
	mortarCost: number;
	lintelConcreteVolume: number;
	lintelSteelKg: number;
	lintelCost: number;
	total: number;
}

const EMPTY_ITEM_COST: ItemMaterialCost = {
	concreteVolume: 0,
	concreteCost: 0,
	concreteGrade: "",
	steelTons: 0,
	steelCost: 0,
	blockCount: 0,
	blockCost: 0,
	blockKey: "",
	sandVolume: 0,
	cementBags: 0,
	mortarCost: 0,
	lintelConcreteVolume: 0,
	lintelSteelKg: 0,
	lintelCost: 0,
	total: 0,
};

/**
 * تكلفة مواد بند إنشائي واحد بالأسعار المحفوظة.
 * البلوك: حبات + مونة (بطحة وأسمنت) + أعتاب الفتحات.
 * غير البلوك: خرسانة بسعر الرتبة + حديد بسعر القطر (من التقطيع).
 *
 * `recalc` — نتيجة التقطيع الجاهزة للبند. مرّرها دائماً من `aggregateBOQ`
 * حتى يكون الحديد على أساس طلبية المصنع المُحسَّنة (بعد إعادة استخدام
 * البواقي)، وهو نفس الأساس الذي يُسعّر به تبويب «المواد». احتسابها هنا
 * لكل بند على حدة يتجاهل التحسين فيخرج رقم أعلى لا يطابق التبويب.
 */
export function computeItemMaterialCost(
	item: {
		category?: string;
		subCategory?: string | null;
		name?: string;
		quantity?: number;
		dimensions?: Record<string, any> | null;
		concreteVolume?: number | null;
		steelWeight?: number | null;
		concreteType?: string | null;
	},
	prices: MaterialPrices,
	recalc?: RecalcResult,
): ItemMaterialCost {
	if (item.category === "blocks") {
		const m: BlockMaterials = deriveBlockMaterials(item as any);
		const blockCost = m.blockCount * (prices.blockPrices[m.key] ?? 0);
		const mortarCost =
			m.sandVolume * prices.mortarSandPrice +
			m.cementBags * prices.mortarCementPrice;
		const lintelCost =
			m.lintelConcreteVolume * prices.lintelConcretePrice +
			(m.lintelSteelKg / 1000) * prices.lintelSteelPrice;

		return {
			...EMPTY_ITEM_COST,
			blockCount: m.blockCount,
			blockCost,
			blockKey: m.key,
			sandVolume: m.sandVolume,
			cementBags: m.cementBags,
			mortarCost,
			lintelConcreteVolume: m.lintelConcreteVolume,
			lintelSteelKg: m.lintelSteelKg,
			lintelCost,
			total: blockCost + mortarCost + lintelCost,
		};
	}

	const isolated = isIsolatedSteelItem(item);
	const grade = item.concreteType || "C30";
	const concreteVolume = num(item.concreteVolume);
	const gradePrice =
		prices.concretePrices[grade] ?? prices.concretePrices.C30 ?? 0;
	const concreteCost = concreteVolume * gradePrice;

	// الحديد بسعر القطر — من أسياخ التقطيع، وإلا الوزن المخزّن بالسعر الرئيسي
	let steelCost = 0;
	let steelTons = 0;
	// وجود جدول تقطيع للبند — الشرط نفسه المستخدم في unscheduledSteelWeight.
	// لا يصح الاستدلال بـ steelTons === 0: بند قُصّت كل قطعه من بواقي عمليات
	// أخرى يخرج بصفر أسياخ جديدة (تكلفته صفر فعلاً)، فكان يُسعَّر مرة ثانية
	// بوزنه المخزّن ويُضخّم تكلفة المواد
	let hasSchedule = false;
	try {
		const cutting =
			recalc ??
			recalculateItem(
				item.category ?? "",
				item.subCategory,
				(item.dimensions ?? {}) as Record<string, number>,
				num(item.quantity) || 1,
				item.name ?? "",
			);
		hasSchedule = cutting.hasRebarParams && cutting.cuttingDetails.length > 0;
		for (const stock of cutting.totals.stocksNeeded) {
			const weightPerMeter = REBAR_WEIGHTS_MAP[stock.diameter] ?? 0;
			const tons = (stock.count * stock.length * weightPerMeter) / 1000;
			steelTons += tons;
			steelCost += tons * steelPriceFor(stock.diameter, prices, isolated);
		}
	} catch {
		hasSchedule = false;
		steelTons = 0;
		steelCost = 0;
	}

	if (!hasSchedule) {
		steelTons = num(item.steelWeight) / 1000;
		steelCost =
			steelTons *
			(isolated && prices.hasIsolatedSteel
				? prices.steelPriceIsolated
				: prices.steelPriceMain);
	}

	return {
		...EMPTY_ITEM_COST,
		concreteVolume,
		concreteCost,
		concreteGrade: grade,
		steelTons,
		steelCost,
		total: concreteCost + steelCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// مزامنة تكلفة المواد مع بنود التكلفة على الخادم
// ═══════════════════════════════════════════════════════════════

export interface CostingItemLike {
	id: string;
	sourceItemId?: string | null;
	description?: string | null;
	quantity: number | string;
}

export interface MaterialCostUpdate {
	id: string;
	materialUnitCost: number;
	storageCostPercent: number;
}

/**
 * يحسب تكلفة مواد الوحدة لكل صف من بنود التكلفة (CostingItem) من البنود
 * الإنشائية الحية والأسعار المحفوظة — بأساس طلبية المصنع المُحسَّن نفسه.
 *
 * مصدر واحد لتبويب «المواد» وزر المزامنة في تقرير التكلفة، حتى لا يبقى
 * الملخص المعتمد (ومنه عرض السعر) أقل من التكلفة الحقيقية لأن بنوداً
 * أُضيفت بعد آخر حفظ فبقيت بتكلفة مواد صفر.
 */
export function buildMaterialCostUpdates(
	items: StructuralItem[],
	costingItems: CostingItemLike[],
	prices: MaterialPrices,
): MaterialCostUpdate[] {
	const boq = aggregateBOQ(items);
	const recalcByItemId = new Map<string, RecalcResult>();
	for (const section of boq.sections) {
		for (const group of section.subGroups) {
			for (const detail of group.items) {
				recalcByItemId.set(detail.item.id, detail.recalc);
			}
		}
	}

	const byId = new Map(items.map((it) => [it.id, it]));
	const byName = new Map(items.map((it) => [it.name, it]));

	return costingItems.map((ci) => {
		// الربط بالمعرّف أولاً — الوصف المخزّن هو "الفئة — الاسم" فلا يطابق
		// الاسم مباشرة إلا في صفوف قديمة
		const description = String(ci.description ?? "");
		const nameFromDescription = description.includes("—")
			? description.slice(description.indexOf("—") + 1).trim()
			: description;
		const match =
			(ci.sourceItemId ? byId.get(ci.sourceItemId) : undefined) ??
			byName.get(nameFromDescription) ??
			byName.get(description);

		if (!match) {
			return {
				id: ci.id,
				materialUnitCost: 0,
				storageCostPercent: prices.storagePercent,
			};
		}

		const cost = computeItemMaterialCost(
			match as any,
			prices,
			recalcByItemId.get(match.id),
		);
		const qty = Number(ci.quantity) || 1;

		return {
			id: ci.id,
			materialUnitCost: qty > 0 ? cost.total / qty : 0,
			storageCostPercent: prices.storagePercent,
		};
	});
}

// ═══════════════════════════════════════════════════════════════
// بناء التقرير
// ═══════════════════════════════════════════════════════════════

interface RowAccumulator {
	quantity: number;
	total: number;
	label: string;
	detail?: string;
	order: number;
}

function pushRow(
	map: Map<string, RowAccumulator>,
	key: string,
	label: string,
	detail: string | undefined,
	quantity: number,
	total: number,
	order: number,
) {
	const existing = map.get(key);
	if (existing) {
		existing.quantity += quantity;
		existing.total += total;
	} else {
		map.set(key, { quantity, total, label, detail, order });
	}
}

function toGroup(
	key: string,
	label: string,
	unit: string,
	map: Map<string, RowAccumulator>,
): CostReportGroup {
	const rows: CostReportRow[] = Array.from(map.entries())
		.sort((a, b) => a[1].order - b[1].order)
		.map(([rowKey, acc]) => ({
			key: rowKey,
			label: acc.label,
			detail: acc.detail,
			quantity: acc.quantity,
			unit,
			unitPrice: acc.quantity > 0 ? acc.total / acc.quantity : 0,
			total: acc.total,
		}));

	return {
		key,
		label,
		unit,
		rows,
		totalQuantity: rows.reduce((s, r) => s + r.quantity, 0),
		total: rows.reduce((s, r) => s + r.total, 0),
	};
}

export interface BuildCostReportInput {
	items: StructuralItem[];
	enabledFloors?: EnabledFloor[];
	/** CostStudy.laborBreakdown الخام */
	laborBreakdown: unknown;
	/** ناتج costing.getSummary */
	summary: any;
	/** ناتج markup.getProfitAnalysis */
	profit: any;
	/** structuralSpecs.hasIsolatedSteel — يفصل سعر حديد الأساسات المعزول */
	hasIsolatedSteel?: boolean;
}

const SECTION_LABEL_AR: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

export function buildCostReport(input: BuildCostReportInput): CostReport {
	const { items, enabledFloors, laborBreakdown, summary, profit } = input;
	const prices = readMaterialPrices(laborBreakdown, input.hasIsolatedSteel);
	const bd = (laborBreakdown ?? {}) as Record<string, any>;

	// تقطيع مُحسَّن مرة واحدة للدراسة كلها — نفس أساس طلبية المصنع وتبويب
	// «المواد»، فلا يخرج التقرير برقم حديد أعلى بسبب تجاهل إعادة استخدام
	// البواقي عند حساب كل بند على حدة
	const boq = aggregateBOQ(items);
	const recalcByItemId = new Map<string, RecalcResult>();
	for (const section of boq.sections) {
		for (const group of section.subGroups) {
			for (const detail of group.items) {
				recalcByItemId.set(detail.item.id, detail.recalc);
			}
		}
	}

	// ─── خريطة تسميات الأدوار ───
	const floorOptions = buildFloorFilterOptions(items, enabledFloors);
	const floorLabelMap = new Map<string, string>();
	const floorOrderMap = new Map<string, number>();
	for (const opt of floorOptions) {
		if (opt.value === "all") continue;
		floorLabelMap.set(opt.value, opt.label);
		floorOrderMap.set(opt.value, opt.sortOrder);
	}
	floorLabelMap.set("shared", "مشترك بين الأدوار");
	floorOrderMap.set("shared", Number.MAX_SAFE_INTEGER - 1);

	const categoryOrder: Record<string, number> = {
		plainConcrete: 0,
		foundations: 1,
		groundBeams: 2,
		columns: 3,
		slabs: 4,
		beams: 5,
		blocks: 6,
		stairs: 7,
		otherStructural: 8,
	};

	// ─── تجميع المواد حسب (البند × الدور) ───
	const concreteMap = new Map<string, RowAccumulator>();
	const steelMap = new Map<string, RowAccumulator>();
	const blockMap = new Map<string, RowAccumulator>();
	const sandMap = new Map<string, RowAccumulator>();
	const cementMap = new Map<string, RowAccumulator>();
	const lintelConcreteMap = new Map<string, RowAccumulator>();
	const lintelSteelMap = new Map<string, RowAccumulator>();

	for (const item of items) {
		const cost = computeItemMaterialCost(
			item as any,
			prices,
			recalcByItemId.get(item.id),
		);
		const floorGroup = getItemFloorGroup(item, enabledFloors);
		const floorLabel = floorLabelMap.get(floorGroup) ?? "غير مصنّف";
		const catLabel = SECTION_LABELS[item.category] ?? item.category;
		const order =
			(categoryOrder[item.category] ?? 99) * 1000 +
			Math.min(999, floorOrderMap.get(floorGroup) ?? 998);

		if (cost.concreteVolume > 0) {
			pushRow(
				concreteMap,
				`${item.category}|${floorGroup}|${cost.concreteGrade}`,
				`خرسانة ${catLabel} (${cost.concreteGrade})`,
				floorLabel,
				cost.concreteVolume,
				cost.concreteCost,
				order,
			);
		}

		if (cost.steelTons > 0) {
			// حديد الأساسات المعزول يُفصل بصفّه ليطابق سعره الخاص
			const isolated = prices.hasIsolatedSteel && isIsolatedSteelItem(item);
			pushRow(
				steelMap,
				`${item.category}|${floorGroup}|${isolated ? "iso" : "std"}`,
				isolated ? `حديد ${catLabel} — معزول (إيبوكسي)` : `حديد ${catLabel}`,
				floorLabel,
				cost.steelTons,
				cost.steelCost,
				order,
			);
		}

		if (cost.blockCount > 0) {
			const [blockType, thickness] = cost.blockKey.split("|");
			pushRow(
				blockMap,
				`${cost.blockKey}|${floorGroup}`,
				blockGroupLabel(blockType ?? "hollow", Number(thickness) || 20),
				floorLabel,
				cost.blockCount,
				cost.blockCost,
				order,
			);
		}

		if (cost.sandVolume > 0) {
			pushRow(
				sandMap,
				`sand|${floorGroup}`,
				"بطحة (رمل المونة)",
				floorLabel,
				cost.sandVolume,
				cost.sandVolume * prices.mortarSandPrice,
				order,
			);
			pushRow(
				cementMap,
				`cement|${floorGroup}`,
				"أسمنت المونة",
				floorLabel,
				cost.cementBags,
				cost.cementBags * prices.mortarCementPrice,
				order,
			);
		}

		if (cost.lintelConcreteVolume > 0) {
			pushRow(
				lintelConcreteMap,
				`lintel-concrete|${floorGroup}`,
				"خرسانة الأعتاب (أبواب وشبابيك)",
				floorLabel,
				cost.lintelConcreteVolume,
				cost.lintelConcreteVolume * prices.lintelConcretePrice,
				order,
			);
		}
		if (cost.lintelSteelKg > 0) {
			pushRow(
				lintelSteelMap,
				`lintel-steel|${floorGroup}`,
				"حديد الأعتاب",
				floorLabel,
				cost.lintelSteelKg / 1000,
				(cost.lintelSteelKg / 1000) * prices.lintelSteelPrice,
				order,
			);
		}
	}

	const materialSections: CostReportSection[] = [];

	const concreteGroup = toGroup("concrete", "الخرسانة", "م³", concreteMap);
	if (concreteGroup.rows.length > 0) {
		materialSections.push({
			key: "concrete",
			label: "الخرسانة",
			icon: "🪨",
			groups: [concreteGroup],
			total: concreteGroup.total,
		});
	}

	const steelGroup = toGroup("steel", "حديد التسليح", "طن", steelMap);
	if (steelGroup.rows.length > 0) {
		materialSections.push({
			key: "steel",
			label: "حديد التسليح",
			icon: "🏗️",
			groups: [steelGroup],
			total: steelGroup.total,
		});
	}

	const blockGroup = toGroup("blocks", "البلوك", "حبة", blockMap);
	if (blockGroup.rows.length > 0) {
		materialSections.push({
			key: "blocks",
			label: "البلوك",
			icon: "🧱",
			groups: [blockGroup],
			total: blockGroup.total,
		});
	}

	const sandGroup = toGroup("sand", "بطحة (رمل المونة)", "م³", sandMap);
	const cementGroup = toGroup("cement", "أسمنت المونة", "كيس", cementMap);
	if (sandGroup.rows.length > 0 || cementGroup.rows.length > 0) {
		const groups = [sandGroup, cementGroup].filter((g) => g.rows.length > 0);
		materialSections.push({
			key: "mortar",
			label: "مونة البناء",
			icon: "🪣",
			groups,
			total: groups.reduce((s, g) => s + g.total, 0),
		});
	}

	const lintelConcreteGroup = toGroup(
		"lintel-concrete",
		"خرسانة الأعتاب",
		"م³",
		lintelConcreteMap,
	);
	const lintelSteelGroup = toGroup(
		"lintel-steel",
		"حديد الأعتاب",
		"طن",
		lintelSteelMap,
	);
	if (lintelConcreteGroup.rows.length > 0 || lintelSteelGroup.rows.length > 0) {
		const groups = [lintelConcreteGroup, lintelSteelGroup].filter(
			(g) => g.rows.length > 0,
		);
		materialSections.push({
			key: "lintels",
			label: "أعتاب الأبواب والشبابيك",
			icon: "🚪",
			groups,
			total: groups.reduce((s, g) => s + g.total, 0),
		});
	}

	const materialTotalComputed = materialSections.reduce(
		(s, sec) => s + sec.total,
		0,
	);

	// ─── جدول الأسعار المعتمدة ───
	const unitPriceRows: CostReportRow[] = [];
	for (const [grade, price] of Object.entries(prices.concretePrices)) {
		if (price > 0) {
			unitPriceRows.push({
				key: `price-concrete-${grade}`,
				label: `خرسانة ${grade}`,
				quantity: 0,
				unit: "م³",
				unitPrice: price,
				total: 0,
			});
		}
	}
	const steelPriceRows: Array<[string, number]> = [
		["حديد Ø6", prices.steelPriceD6],
		["حديد Ø8", prices.steelPriceD8],
		["حديد تسليح (Ø10+)", prices.steelPriceMain],
		...(prices.hasIsolatedSteel
			? ([[ISOLATED_STEEL_LABEL, prices.steelPriceIsolated]] as Array<
					[string, number]
				>)
			: []),
	];
	for (const [label, price] of steelPriceRows) {
		if (price > 0) {
			unitPriceRows.push({
				key: `price-${label}`,
				label,
				quantity: 0,
				unit: "طن",
				unitPrice: price,
				total: 0,
			});
		}
	}
	for (const [key, price] of Object.entries(prices.blockPrices)) {
		if (price > 0) {
			const [blockType, thickness] = key.split("|");
			unitPriceRows.push({
				key: `price-block-${key}`,
				label: blockGroupLabel(blockType ?? "hollow", Number(thickness) || 20),
				quantity: 0,
				unit: "حبة",
				unitPrice: price,
				total: 0,
			});
		}
	}
	const extraPriceRows: Array<[string, number, string]> = [
		["بطحة (رمل المونة)", prices.mortarSandPrice, "م³"],
		["أسمنت المونة", prices.mortarCementPrice, "كيس"],
		["خرسانة الأعتاب", prices.lintelConcretePrice, "م³"],
		["حديد الأعتاب", prices.lintelSteelPrice, "طن"],
	];
	for (const [label, price, unit] of extraPriceRows) {
		if (price > 0) {
			unitPriceRows.push({
				key: `price-${label}`,
				label,
				quantity: 0,
				unit,
				unitPrice: price,
				total: 0,
			});
		}
	}

	// ─── المصنعيات ───
	const laborGroups: CostReportGroup[] = [];
	const laborMode = String(bd.laborMode ?? "");

	const buildStringRows = (
		rows: any[],
		unitFallback: string,
		qtyKey: string,
		priceKey: string,
	): CostReportRow[] =>
		(Array.isArray(rows) ? rows : [])
			.map((r, i) => {
				const quantity = num(r?.[qtyKey]);
				const unitPrice = num(r?.[priceKey]);
				return {
					key: String(r?.id ?? i),
					label: String(r?.label ?? ""),
					quantity,
					unit: String(r?.unit ?? unitFallback),
					unitPrice,
					total: quantity * unitPrice,
				};
			})
			.filter((r) => r.total > 0 || r.quantity > 0);

	const makeGroup = (
		key: string,
		label: string,
		unit: string,
		rows: CostReportRow[],
	): CostReportGroup => ({
		key,
		label,
		unit,
		rows,
		totalQuantity: rows.reduce((s, r) => s + r.quantity, 0),
		total: rows.reduce((s, r) => s + r.total, 0),
	});

	if (laborMode === "per_sqm") {
		const floorLaborRows = buildStringRows(
			bd.floorRows,
			"م²",
			"area",
			"pricePerSqm",
		);
		if (floorLaborRows.length > 0) {
			laborGroups.push(
				makeGroup("labor-floors", "مصنعيات العظم بالمتر المسطح", "م²", floorLaborRows),
			);
		}
		const extra = buildStringRows(bd.extraRows, "م.ط", "quantity", "pricePerUnit");
		if (extra.length > 0) {
			laborGroups.push(makeGroup("labor-extra", "أعمال إضافية", "م.ط", extra));
		}
	} else if (laborMode === "per_cbm_ton") {
		const cbm = buildStringRows(bd.cbmRows, "م³", "quantity", "pricePerUnit");
		if (cbm.length > 0) {
			laborGroups.push(
				makeGroup("labor-cbm", "مصنعيات بالمتر المكعب والطن", "م³", cbm),
			);
		}
	} else if (laborMode === "lump_sum") {
		const amount = num(bd.lumpSumAmount);
		if (amount > 0) {
			laborGroups.push(
				makeGroup("labor-lump", "مصنعيات العظم بالمقطوعية", "مقطوعية", [
					{
						key: "lump",
						label: "مبلغ المقطوعية",
						quantity: 1,
						unit: "مقطوعية",
						unitPrice: amount,
						total: amount,
					},
				]),
			);
		}
	} else if (laborMode === "salary") {
		const workers = (Array.isArray(bd.salaryWorkers) ? bd.salaryWorkers : []).map(
			(w: any, i: number) => {
				const count = num(w?.count);
				const salary = num(w?.salary);
				const months = num(w?.months);
				return {
					key: String(w?.id ?? i),
					label: String(w?.craft ?? ""),
					detail: `${count} × ${months} شهر`,
					quantity: count * months,
					unit: "شهر-عامل",
					unitPrice: salary,
					total: count * salary * months,
				};
			},
		);
		const extras: CostReportRow[] = [];
		if (num(bd.salaryInsurance) > 0) {
			extras.push({
				key: "insurance",
				label: "التأمينات",
				quantity: 1,
				unit: "مبلغ",
				unitPrice: num(bd.salaryInsurance),
				total: num(bd.salaryInsurance),
			});
		}
		if (num(bd.salaryHousing) > 0) {
			extras.push({
				key: "housing",
				label: "السكن",
				quantity: 1,
				unit: "مبلغ",
				unitPrice: num(bd.salaryHousing),
				total: num(bd.salaryHousing),
			});
		}
		const rows = [...workers, ...extras].filter((r) => r.total > 0);
		if (rows.length > 0) {
			laborGroups.push(makeGroup("labor-salary", "عمالة بالراتب الشهري", "شهر-عامل", rows));
		}
	}

	// مصنعيات البلوك — تُحفظ منفصلة وتدخل في طريقتي م² و م³/طن
	const blockLaborRows = buildStringRows(
		bd.blockLaborRows,
		"م²",
		"quantity",
		"pricePerUnit",
	);
	if (
		blockLaborRows.length > 0 &&
		(laborMode === "per_sqm" || laborMode === "per_cbm_ton")
	) {
		laborGroups.push(
			makeGroup("labor-blocks", "مصنعيات بناء البلوك", "م²", blockLaborRows),
		);
	}

	// مصنعيات الأقسام الأخرى (تشطيبات / MEP / يدوي) — من الخادم
	const serverSections: any[] = summary?.sections ?? [];
	const otherLaborRows: CostReportRow[] = serverSections
		.filter((s) => s.section !== "STRUCTURAL" && num(s.laborTotal) > 0)
		.map((s) => ({
			key: `labor-${s.section}`,
			label: SECTION_LABEL_AR[s.section] ?? s.section,
			quantity: 1,
			unit: "قسم",
			unitPrice: num(s.laborTotal),
			total: num(s.laborTotal),
		}));
	if (otherLaborRows.length > 0) {
		laborGroups.push(
			makeGroup("labor-other", "مصنعيات الأقسام الأخرى", "قسم", otherLaborRows),
		);
	}

	const laborSection: CostReportSection = {
		key: "labor",
		label: "المصنعيات",
		icon: "👷",
		groups: laborGroups,
		total: num(summary?.grandTotal?.labor),
	};

	// ─── التشوين والمصاريف الأخرى ───
	const storageRows: CostReportRow[] = [];
	const storageTotal = num(summary?.grandTotal?.storage);
	const otherTotal = num(summary?.grandTotal?.other);
	if (storageTotal > 0) {
		storageRows.push({
			key: "storage",
			label: `التشوين (${prices.storagePercent}% من المواد)`,
			quantity: 1,
			unit: "مبلغ",
			unitPrice: storageTotal,
			total: storageTotal,
		});
	}
	if (otherTotal > 0) {
		storageRows.push({
			key: "other",
			label: "مصاريف أخرى على البنود",
			quantity: 1,
			unit: "مبلغ",
			unitPrice: otherTotal,
			total: otherTotal,
		});
	}
	const storageSection: CostReportSection = {
		key: "storage",
		label: "تشوين ومصاريف أخرى",
		icon: "📦",
		groups:
			storageRows.length > 0
				? [makeGroup("storage", "تشوين ومصاريف أخرى", "مبلغ", storageRows)]
				: [],
		total: storageTotal + otherTotal,
	};

	// ─── المصاريف غير المباشرة ───
	const indirect = summary?.indirect ?? {};
	const rawIndirect = (bd.indirectCosts ?? {}) as Record<string, any>;
	const consumableRows: CostReportRow[] = [];
	if (num(indirect.tieWireTotal) > 0) {
		const kg = num(rawIndirect.steelTons) * num(rawIndirect.tieWireKgPerTon);
		consumableRows.push({
			key: "tie-wire",
			label: "سلك التربيط",
			detail: `${num(rawIndirect.tieWireKgPerTon)} كجم/طن حديد`,
			quantity: kg,
			unit: "كجم",
			unitPrice: num(rawIndirect.tieWirePricePerKg),
			total: num(indirect.tieWireTotal),
		});
	}
	if (num(indirect.nailsTotal) > 0) {
		const kg = num(rawIndirect.formworkArea) * num(rawIndirect.nailsKgPerSqm);
		consumableRows.push({
			key: "nails",
			label: "مسامير الشدات",
			detail: `${num(rawIndirect.nailsKgPerSqm)} كجم/م² شدة`,
			quantity: kg,
			unit: "كجم",
			unitPrice: num(rawIndirect.nailsPricePerKg),
			total: num(indirect.nailsTotal),
		});
	}

	const supervisionRows: CostReportRow[] = (
		Array.isArray(rawIndirect.supervision) ? rawIndirect.supervision : []
	)
		.map((r: any, i: number) => {
			const count = num(r?.count);
			const months = num(r?.months);
			const salary = num(r?.monthlySalary);
			return {
				key: String(r?.id ?? i),
				label: String(r?.role ?? ""),
				detail: `${count} × ${months} شهر`,
				quantity: count * months,
				unit: "شهر-فرد",
				unitPrice: salary,
				total: count * salary * months,
			};
		})
		.filter((r: CostReportRow) => r.total > 0);

	const operatingRows: CostReportRow[] = (
		Array.isArray(rawIndirect.operating) ? rawIndirect.operating : []
	)
		.map((r: any, i: number) => ({
			key: String(r?.id ?? i),
			label: String(r?.label ?? ""),
			quantity: 1,
			unit: "مبلغ",
			unitPrice: num(r?.amount),
			total: num(r?.amount),
		}))
		.filter((r: CostReportRow) => r.total > 0);

	const indirectGroups: CostReportGroup[] = [];
	if (consumableRows.length > 0) {
		indirectGroups.push(
			makeGroup("consumables", "مستهلكات (سلك ومسمار)", "كجم", consumableRows),
		);
	}
	if (supervisionRows.length > 0) {
		indirectGroups.push(
			makeGroup("supervision", "الإشراف الهندسي والميداني", "شهر-فرد", supervisionRows),
		);
	}
	if (operatingRows.length > 0) {
		indirectGroups.push(
			makeGroup("operating", "مصاريف التشغيل", "مبلغ", operatingRows),
		);
	}

	const indirectSection: CostReportSection = {
		key: "indirect",
		label: "مصاريف غير مباشرة (سلك ومسمار، إشراف، تشغيل)",
		icon: "🧾",
		groups: indirectGroups,
		total: num(indirect.total),
	};

	// ─── الملخص النهائي (من الخادم) ───
	const grandTotal = num(summary?.grandTotal?.total);
	const serverMaterial = num(summary?.grandTotal?.material);
	const pct = (v: number) => (grandTotal > 0 ? (v / grandTotal) * 100 : 0);

	const summaryRows: CostReportSummaryRow[] = [
		{
			key: "materials",
			label: "المواد",
			total: serverMaterial,
			percent: pct(serverMaterial),
		},
		{
			key: "labor",
			label: "المصنعيات",
			total: laborSection.total,
			percent: pct(laborSection.total),
		},
		{
			key: "storage",
			label: "تشوين ومصاريف أخرى",
			total: storageSection.total,
			percent: pct(storageSection.total),
		},
		{
			key: "indirect",
			label: "مصاريف غير مباشرة",
			total: indirectSection.total,
			percent: pct(indirectSection.total),
		},
	].filter((r) => r.total > 0);

	const pricing: CostReportPricing | null = profit
		? {
				totalCost: num(profit.totalCost),
				overheadAmount: num(profit.overheadAmount),
				profitAmount: num(profit.profitAmount),
				contingencyAmount: num(profit.contingencyAmount),
				sellingPriceBeforeVat: num(profit.sellingPriceBeforeVat),
				vatAmount: num(profit.vatAmount),
				grandTotal: num(profit.grandTotal),
				profitPercent: num(profit.profitPercent),
				costPerSqm: num(profit.costPerSqm),
				pricePerSqm: num(profit.pricePerSqm),
				buildingArea: num(profit.buildingArea),
			}
		: null;

	return {
		materialSections,
		unitPriceRows,
		materialTotalComputed,
		laborSection,
		storageSection,
		indirectSection,
		summaryRows,
		grandTotal,
		pricing,
		materialDrift: materialTotalComputed - serverMaterial,
	};
}
