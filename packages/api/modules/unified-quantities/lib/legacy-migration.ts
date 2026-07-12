// ════════════════════════════════════════════════════════════════
// Legacy Migration Planner — جسر ترحيل الدراسات القديمة
//
// يحوّل بنود FinishingItem / MEPItem القديمة + buildingConfig إلى
// خطة إنشاء QuantityItem / QuantityItemContext للنظام الموحَّد.
//
// دالة pure بالكامل (لا DB) — القرارات:
// 1. الأرقام المحفوظة هي الحقيقة: لا يُعاد تشغيل محركات الاشتقاق أبداً.
// 2. المطابقة مع الكتالوج تتم عبر خرائط صريحة (legacy category/itemType
//    → itemKey) لأن legacyDerivationType/legacyScope في الكتالوج قيم
//    عامة (direct_area/per_unit/...) لا تميّز البنود القديمة. تُقبل
//    المطابقة فقط إذا وُجد الـ itemKey فعلاً في ItemCatalogEntry
//    المُمرَّرة (lookup مبني من DB).
// 3. بند مطابق + طريقة حساب بسيطة (direct_area/length_only/per_unit):
//    primaryValue = الكمية الأساسية، والهدر يُحمَل كما هو — إعادة
//    الحساب مستقبلاً تعطي نفس الكمية الفعّالة.
// 4. بند غير مطابق (أو طريقة مركّبة): calculationMethod = "manual"
//    و primaryValue = الكمية الفعّالة القديمة (الهدر مدموج) — لا
//    يُفقد أي بند صامتاً.
// 5. Idempotency: وجود أي QuantityItem على الدراسة → تخطٍّ كامل.
// ════════════════════════════════════════════════════════════════

import { round } from "../compute/types";
import { calculatePricing } from "../pricing/pricing-calculator";

// ── أنواع المدخلات (أرقام Prisma Decimal تُمرَّر كـ number بعد التحويل) ──

export interface LegacyFinishingRow {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	description?: string | null;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	length?: number | null;
	quantity?: number | null;
	unit: string;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	brand?: string | null;
	qualityLevel?: string | null;
	specifications?: string | null;
	specData?: unknown;
	scope?: string | null;
	isEnabled: boolean;
	sortOrder?: number | null;
}

export interface LegacyMepRow {
	id: string;
	category: string;
	subCategory?: string | null;
	itemType?: string | null;
	name: string;
	floorId?: string | null;
	floorName?: string | null;
	roomName?: string | null;
	scope?: string | null;
	quantity?: number | null;
	length?: number | null;
	area?: number | null;
	unit: string;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	specifications?: string | null;
	specData?: unknown;
	qualityLevel?: string | null;
	isEnabled: boolean;
	sortOrder?: number | null;
}

/** Snapshot من ItemCatalogEntry (يُبنى من DB في الـ procedure) */
export interface CatalogLookupEntry {
	itemKey: string;
	domain: string;
	categoryKey: string;
	defaultCalculationMethod: string;
}

export interface PlannedQuantityItem {
	legacySource: "finishing" | "mep";
	legacyId: string;
	matched: boolean;

	domain: string;
	categoryKey: string;
	catalogItemKey: string;
	displayName: string;
	sortOrder: number;
	isEnabled: boolean;

	calculationMethod: string;
	unit: string;
	primaryValue: number;
	wastagePercent: number;
	computedQuantity: number;
	effectiveQuantity: number;
	contextScope: string | null;

	specMaterialName: string | null;
	specMaterialBrand: string | null;
	specMaterialGrade: string | null;
	specNotes: string | null;

	materialUnitPrice: number;
	laborUnitPrice: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
	sellUnitPrice: number;
	sellTotalAmount: number;
	profitAmount: number;
	profitPercent: number;

	notes: string | null;
}

export interface PlannedSpace {
	name: string;
	spaceType: string;
	floorLabel: string | null;
	length: number | null;
	width: number | null;
	height: number | null;
	floorArea: number | null;
	computedFloorArea: number | null;
	computedWallArea: number | null;
	isWetArea: boolean;
	isExterior: boolean;
	sortOrder: number;
}

export interface PlannedOpening {
	name: string;
	openingType: string;
	width: number;
	height: number;
	computedArea: number;
	count: number;
	isExterior: boolean;
	deductFromInteriorFinishes: boolean;
}

export interface PlannedContext {
	totalFloorArea: number | null;
	totalExteriorWallArea: number | null;
	totalRoofArea: number | null;
	totalPerimeter: number | null;
	averageFloorHeight: number | null;
	hasBasement: boolean;
	hasRoof: boolean;
	hasYard: boolean;
	yardArea: number | null;
	fenceLength: number | null;
	spaces: PlannedSpace[];
	openings: PlannedOpening[];
}

export interface MigrationPlanInput {
	/** عدد QuantityItem الموجودة مسبقاً — أي قيمة > 0 تعني تخطي الترحيل */
	existingQuantityItemCount: number;
	/** هل يوجد QuantityItemContext مسبقاً؟ (لا نلمس السياق لو موجود) */
	hasExistingContext: boolean;
	finishingRows: LegacyFinishingRow[];
	mepRows: LegacyMepRow[];
	/** CostStudy.buildingConfig (SmartBuildingConfig JSON أو null) */
	buildingConfig: unknown;
	/** CostStudy.globalMarkupPercent — لتسعير البنود المرحَّلة */
	globalMarkupPercent: number;
}

export interface MigrationPlan {
	skip: boolean;
	skipReason: "already_migrated" | null;
	items: PlannedQuantityItem[];
	context: PlannedContext | null;
	stats: {
		migratedFinishing: number;
		migratedMep: number;
		skipped: number;
		unmatchedToManual: number;
		spacesPlanned: number;
		openingsPlanned: number;
	};
}

// ── خرائط المطابقة: legacy → catalog itemKey ────────────────────
// المفاتيح اليسرى هي قيم FinishingItem.category التي يكتبها
// mapCategoryKey في apps/web/modules/saas/pricing/lib/merge-quantities.ts

export const LEGACY_FINISHING_TO_CATALOG: Record<string, string> = {
	FINISHING_INTERNAL_PLASTER: "finishing.plaster.interior",
	FINISHING_EXTERNAL_PLASTER: "finishing.plaster.exterior",
	FINISHING_INTERIOR_PAINT: "finishing.paint.interior",
	FINISHING_FACADE_PAINT: "finishing.paint.exterior",
	FINISHING_BOUNDARY_PAINT: "finishing.paint.exterior",
	FINISHING_FLOOR_TILES: "finishing.flooring.ceramic",
	FINISHING_FALSE_CEILING: "finishing.ceiling.gypsum_board",
	FINISHING_INTERIOR_DOORS: "finishing.doors.interior_wood",
	FINISHING_EXTERIOR_DOORS: "finishing.doors.exterior_steel",
	FINISHING_WINDOWS: "finishing.windows.aluminum",
	FINISHING_KITCHEN: "finishing.kitchen.cabinets",
	FINISHING_STONE_FACADE: "finishing.cladding.natural_stone",
	FINISHING_YARD_PAVING: "exterior.driveway",
	FINISHING_FENCE_GATES: "exterior.main_gate",
	FINISHING_LANDSCAPING: "exterior.landscaping",
	// لا مقابل في الكتالوج (تسقط إلى manual):
	// FINISHING_BATHROOMS, FINISHING_MARBLE_VANITIES,
	// FINISHING_INTERNAL_STAIRS, FINISHING_EXTERNAL_STAIRS,
	// FINISHING_RAILINGS, FINISHING_FACADE_DECOR, FINISHING_ROOF,
	// FINISHING_INTERIOR_DECOR
};

/** العزل يتمايز بالـ subCategory */
const LEGACY_WATERPROOFING_SUB: Record<string, string> = {
	WP_FOUNDATIONS: "finishing.insulation.foundation",
	WP_ROOF: "finishing.insulation.waterproof_roof",
	// WP_BATHROOMS: لا مقابل → manual
};

const LEGACY_THERMAL_SUB: Record<string, string> = {
	TI_WALLS: "finishing.insulation.thermal_walls",
	TI_ROOF: "finishing.insulation.thermal_roof",
};

/**
 * FINISHING_WALL_TILES يجمع سيراميك الحمامات وسبلاش باك المطبخ بنفس
 * الـ category بلا subCategory — نميّز بالاسم المحفوظ
 * ("سبلاش باك مطبخ" vs "تكسيات جدران حمامات").
 */
function resolveWallTilesKey(name: string): string {
	return name.includes("مطبخ")
		? "finishing.walls.kitchen_ceramic"
		: "finishing.walls.bathroom_ceramic";
}

export function resolveFinishingCatalogKey(
	row: Pick<LegacyFinishingRow, "category" | "subCategory" | "name">,
): string | null {
	if (row.category === "FINISHING_WATERPROOFING") {
		return LEGACY_WATERPROOFING_SUB[row.subCategory ?? ""] ?? null;
	}
	if (row.category === "FINISHING_THERMAL_INSULATION") {
		return LEGACY_THERMAL_SUB[row.subCategory ?? ""] ?? null;
	}
	if (row.category === "FINISHING_WALL_TILES") {
		return resolveWallTilesKey(row.name ?? "");
	}
	return LEGACY_FINISHING_TO_CATALOG[row.category] ?? null;
}

// MEP: المطابقة بالـ itemType أولاً ثم fallback على subCategory
export const LEGACY_MEP_ITEMTYPE_TO_CATALOG: Record<string, string> = {
	// ELECTRICAL
	spot_light: "mep.electrical.lighting_ceiling",
	chandelier_point: "mep.electrical.lighting_ceiling",
	outdoor_light: "mep.electrical.lighting_outdoor",
	outlet_13a: "mep.electrical.outlet_normal",
	outlet_external: "mep.electrical.outlet_normal",
	outlet_20a_ac: "mep.electrical.outlet_3phase",
	outlet_20a_heater: "mep.electrical.outlet_3phase",
	outlet_20a_washer: "mep.electrical.outlet_3phase",
	outlet_32a_oven: "mep.electrical.outlet_3phase",
	main_panel: "mep.electrical.main_panel",
	earthing_system: "mep.electrical.grounding_system",
	// PLUMBING
	tank_fiberglass: "mep.plumbing.water_tank",
	heater_50l: "mep.plumbing.water_heater_electric",
	heater_80l: "mep.plumbing.water_heater_electric",
	// HVAC
	split_1ton: "mep.hvac.split_unit",
	split_1_5ton: "mep.hvac.split_unit",
	split_2ton: "mep.hvac.split_unit",
	split_2_5ton: "mep.hvac.split_unit",
	split_3ton: "mep.hvac.split_unit",
	exhaust_fan_kitchen: "mep.hvac.exhaust_fan",
	exhaust_fan_bath: "mep.hvac.exhaust_fan",
	// FIREFIGHTING
	extinguisher_abc: "mep.firefighting.extinguisher",
	smoke_detector: "mep.firefighting.smoke_detector",
	heat_detector: "mep.firefighting.heat_detector",
	sprinkler_head: "mep.firefighting.sprinkler",
	facp_8zone: "mep.firefighting.fire_panel",
	// LOW_CURRENT
	network_point: "mep.low_current.internet_point",
	camera_bullet: "mep.low_current.cctv_camera",
	intercom_outdoor: "mep.low_current.intercom",
	intercom_indoor: "mep.low_current.intercom",
	// SPECIAL
	elevator_6person: "special.elevator",
	elevator_8person: "special.elevator",
};

export const LEGACY_MEP_SUBCATEGORY_TO_CATALOG: Record<string, string> = {
	// ELECTRICAL
	cables: "mep.electrical.cable_run",
	panels: "mep.electrical.sub_panel",
	lighting: "mep.electrical.lighting_ceiling",
	power_outlets: "mep.electrical.outlet_normal",
	earthing: "mep.electrical.grounding_system",
	// PLUMBING ("pipes" خاص بالسباكة — مواسير HVAC تحت refrigerant/condensate)
	pipes: "mep.plumbing.pipe_run",
	pumps: "mep.plumbing.pump",
	tanks: "mep.plumbing.water_tank",
	heaters: "mep.plumbing.water_heater_electric",
	// HVAC
	ac_units: "mep.hvac.split_unit",
	ventilation: "mep.hvac.ventilation_grille",
	// FIREFIGHTING
	sprinklers: "mep.firefighting.sprinkler",
	extinguishers: "mep.firefighting.extinguisher",
	// LOW_CURRENT
	cctv: "mep.low_current.cctv_camera",
	network: "mep.low_current.internet_point",
	intercom: "mep.low_current.intercom",
	// SPECIAL
	elevator: "special.elevator",
};

export function resolveMepCatalogKey(
	row: Pick<LegacyMepRow, "itemType" | "subCategory">,
): string | null {
	if (row.itemType && LEGACY_MEP_ITEMTYPE_TO_CATALOG[row.itemType]) {
		return LEGACY_MEP_ITEMTYPE_TO_CATALOG[row.itemType];
	}
	if (row.subCategory && LEGACY_MEP_SUBCATEGORY_TO_CATALOG[row.subCategory]) {
		return LEGACY_MEP_SUBCATEGORY_TO_CATALOG[row.subCategory];
	}
	return null;
}

// ── قواعد الكمية ─────────────────────────────────────────────────

/** وحدات العدّ — المحرك القديم لا يطبّق عليها هدراً (merge-quantities.ts) */
const COUNT_UNITS = new Set([
	"piece",
	"عدد",
	"طقم",
	"وحدة",
	"lump_sum",
	"مقطوعية",
]);

/** طرق يعيد حسابها المحرك الموحَّد كـ primary × (1 + wastage/100) */
const SIMPLE_METHODS = new Set(["direct_area", "length_only", "per_unit"]);

/** scope القديم → contextScope الموحَّد */
const SCOPE_MAP: Record<string, string> = {
	per_floor: "per_floor",
	per_room: "per_room",
	whole_building: "whole_building",
	per_building: "whole_building",
	roof: "whole_building",
	external: "standalone",
};

function toNum(v: number | null | undefined): number {
	return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function pickPositive(...values: Array<number | null | undefined>): number {
	for (const v of values) {
		const n = toNum(v);
		if (n > 0) return n;
	}
	return 0;
}

/** استخراج المواصفات من specData القديمة (ItemSpecification) — best effort */
function extractSpec(specData: unknown): {
	materialName: string | null;
	brand: string | null;
	notes: string | null;
} {
	if (!specData || typeof specData !== "object") {
		return { materialName: null, brand: null, notes: null };
	}
	const spec = specData as Record<string, unknown>;
	const materialName =
		typeof spec.specTypeLabel === "string" && spec.specTypeLabel
			? spec.specTypeLabel
			: null;
	let brand: string | null = null;
	if (Array.isArray(spec.subItems)) {
		const main = spec.subItems.find(
			(s): s is Record<string, unknown> =>
				!!s && typeof s === "object" && (s as Record<string, unknown>).category === "main",
		);
		if (main && typeof main.brand === "string" && main.brand) {
			brand = main.brand;
		}
	}
	const notes = typeof spec.notes === "string" && spec.notes ? spec.notes : null;
	return { materialName, brand, notes };
}

function joinNotes(...parts: Array<string | null | undefined>): string | null {
	const joined = parts
		.map((p) => p?.trim())
		.filter((p): p is string => !!p)
		.join("\n");
	return joined ? joined.slice(0, 2000) : null;
}

interface QuantityMapping {
	calculationMethod: string;
	primaryValue: number;
	wastagePercent: number;
	computedQuantity: number;
	effectiveQuantity: number;
}

/**
 * يقرر طريقة الحساب والقيم بحيث تبقى الكمية الفعّالة القديمة صحيحة:
 * - مطابق + طريقة بسيطة: primary = الأساس، الهدر محمول (0 لوحدات العدّ
 *   لمطابقة سلوك المحرك القديم الذي لا يطبّق هدراً عليها).
 * - غير ذلك: manual و primary = الكمية الفعّالة (الهدر مدموج، الهدر 0).
 */
function mapQuantity(
	baseQty: number,
	wastage: number,
	unit: string,
	catalogMethod: string | null,
): QuantityMapping {
	const isCountUnit = COUNT_UNITS.has(unit);
	const effectiveWastage = isCountUnit ? 0 : Math.max(0, wastage);
	const legacyEffective = round(baseQty * (1 + effectiveWastage / 100), 4);

	if (catalogMethod && SIMPLE_METHODS.has(catalogMethod)) {
		return {
			calculationMethod: catalogMethod,
			primaryValue: round(baseQty, 4),
			wastagePercent: effectiveWastage,
			computedQuantity: round(baseQty, 4),
			effectiveQuantity: legacyEffective,
		};
	}

	return {
		calculationMethod: "manual",
		primaryValue: legacyEffective,
		wastagePercent: 0,
		computedQuantity: legacyEffective,
		effectiveQuantity: legacyEffective,
	};
}

function buildDisplayName(
	name: string,
	fallback: string,
	locationLabel?: string | null,
): string {
	const base = (name || fallback).trim() || fallback;
	if (locationLabel && !base.includes(locationLabel)) {
		return `${base} — ${locationLabel}`.slice(0, 300);
	}
	return base.slice(0, 300);
}

// ── تحويل بند تشطيبات قديم ───────────────────────────────────────

function planFinishingItem(
	row: LegacyFinishingRow,
	catalogByKey: Map<string, CatalogLookupEntry>,
	sortOrder: number,
	globalMarkupPercent: number,
): PlannedQuantityItem {
	const resolvedKey = resolveFinishingCatalogKey(row);
	const entry = resolvedKey ? (catalogByKey.get(resolvedKey) ?? null) : null;
	const matched = entry !== null;

	const baseQty = pickPositive(row.area, row.length, row.quantity);
	const qty = mapQuantity(
		baseQty,
		toNum(row.wastagePercent),
		row.unit,
		entry ? entry.defaultCalculationMethod : null,
	);

	const spec = extractSpec(row.specData);
	const pricing = calculatePricing({
		effectiveQuantity: qty.effectiveQuantity,
		materialUnitPrice: toNum(row.materialPrice),
		laborUnitPrice: toNum(row.laborPrice),
		markupMethod: "percentage",
		markupPercent: null,
		markupFixedAmount: null,
		manualUnitPrice: null,
		globalMarkupPercent,
		hasCustomMarkup: false,
	});

	return {
		legacySource: "finishing",
		legacyId: row.id,
		matched,
		domain: entry ? entry.domain : "FINISHING",
		categoryKey: entry ? entry.categoryKey : row.category.toLowerCase(),
		catalogItemKey: entry ? entry.itemKey : `legacy.${row.category}`,
		displayName: buildDisplayName(row.name, row.category, row.floorName),
		sortOrder,
		isEnabled: true,
		calculationMethod: qty.calculationMethod,
		unit: row.unit || "m2",
		primaryValue: qty.primaryValue,
		wastagePercent: qty.wastagePercent,
		computedQuantity: qty.computedQuantity,
		effectiveQuantity: qty.effectiveQuantity,
		contextScope: SCOPE_MAP[row.scope ?? ""] ?? null,
		specMaterialName: spec.materialName,
		specMaterialBrand: row.brand ?? spec.brand,
		specMaterialGrade: row.qualityLevel ?? null,
		specNotes: joinNotes(row.specifications, spec.notes),
		materialUnitPrice: toNum(row.materialPrice),
		laborUnitPrice: toNum(row.laborPrice),
		materialCost: pricing.materialCost,
		laborCost: pricing.laborCost,
		totalCost: pricing.totalCost,
		sellUnitPrice: pricing.sellUnitPrice,
		sellTotalAmount: pricing.sellTotalAmount,
		profitAmount: pricing.profitAmount,
		profitPercent: pricing.profitPercent,
		notes: joinNotes(
			row.description,
			`مُرحَّل من النظام القديم (${row.category})`,
		),
	};
}

// ── تحويل بند MEP قديم ───────────────────────────────────────────

function planMepItem(
	row: LegacyMepRow,
	catalogByKey: Map<string, CatalogLookupEntry>,
	sortOrder: number,
	globalMarkupPercent: number,
): PlannedQuantityItem {
	const resolvedKey = resolveMepCatalogKey(row);
	const entry = resolvedKey ? (catalogByKey.get(resolvedKey) ?? null) : null;
	const matched = entry !== null;

	const baseQty = pickPositive(row.quantity, row.length, row.area);
	const qty = mapQuantity(
		baseQty,
		toNum(row.wastagePercent),
		row.unit,
		entry ? entry.defaultCalculationMethod : null,
	);

	const spec = extractSpec(row.specData);
	const locationLabel = row.roomName || row.floorName;
	const pricing = calculatePricing({
		effectiveQuantity: qty.effectiveQuantity,
		materialUnitPrice: toNum(row.materialPrice),
		laborUnitPrice: toNum(row.laborPrice),
		markupMethod: "percentage",
		markupPercent: null,
		markupFixedAmount: null,
		manualUnitPrice: null,
		globalMarkupPercent,
		hasCustomMarkup: false,
	});

	return {
		legacySource: "mep",
		legacyId: row.id,
		matched,
		domain: entry ? entry.domain : "MEP",
		categoryKey: entry ? entry.categoryKey : row.category.toLowerCase(),
		catalogItemKey: entry
			? entry.itemKey
			: `legacy.MEP_${row.category}${row.itemType ? `.${row.itemType}` : ""}`,
		displayName: buildDisplayName(row.name, row.category, locationLabel),
		sortOrder,
		isEnabled: true,
		calculationMethod: qty.calculationMethod,
		unit: row.unit || "عدد",
		primaryValue: qty.primaryValue,
		wastagePercent: qty.wastagePercent,
		computedQuantity: qty.computedQuantity,
		effectiveQuantity: qty.effectiveQuantity,
		contextScope: SCOPE_MAP[row.scope ?? ""] ?? null,
		specMaterialName: spec.materialName,
		specMaterialBrand: spec.brand,
		specMaterialGrade: row.qualityLevel ?? null,
		specNotes: joinNotes(row.specifications, spec.notes),
		materialUnitPrice: toNum(row.materialPrice),
		laborUnitPrice: toNum(row.laborPrice),
		materialCost: pricing.materialCost,
		laborCost: pricing.laborCost,
		totalCost: pricing.totalCost,
		sellUnitPrice: pricing.sellUnitPrice,
		sellTotalAmount: pricing.sellTotalAmount,
		profitAmount: pricing.profitAmount,
		profitPercent: pricing.profitPercent,
		notes: joinNotes(
			`مُرحَّل من النظام القديم (${row.category}${row.itemType ? ` / ${row.itemType}` : ""})`,
		),
	};
}

// ── buildingConfig → QuantityItemContext + Spaces + Openings ────

const WET_ROOM_TYPES = new Set(["bathroom", "kitchen", "laundry"]);

interface RawRoom {
	name?: unknown;
	length?: unknown;
	width?: unknown;
	type?: unknown;
}

interface RawOpening {
	type?: unknown;
	subType?: unknown;
	width?: unknown;
	height?: unknown;
	count?: unknown;
	isExternal?: unknown;
}

interface RawFloor {
	name?: unknown;
	area?: unknown;
	height?: unknown;
	floorType?: unknown;
	isRepeated?: unknown;
	repeatCount?: unknown;
	rooms?: unknown;
	openings?: unknown;
}

function asNum(v: unknown): number {
	return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function planContextFromBuildingConfig(
	buildingConfig: unknown,
): PlannedContext | null {
	if (!buildingConfig || typeof buildingConfig !== "object") return null;
	const config = buildingConfig as Record<string, unknown>;
	const floors = Array.isArray(config.floors)
		? (config.floors as RawFloor[])
		: [];
	if (floors.length === 0) return null;

	const spaces: PlannedSpace[] = [];
	const openings: PlannedOpening[] = [];

	let totalFloorArea = 0;
	let heightSum = 0;
	let heightCount = 0;
	let exteriorWallHeight = 0;
	let hasBasement = false;
	let roofArea = 0;
	let lastRegularArea = 0;
	let spaceSort = 0;

	for (const floor of floors) {
		const floorType = typeof floor.floorType === "string" ? floor.floorType : "";
		const floorName = typeof floor.name === "string" ? floor.name : "";
		const area = asNum(floor.area);
		const height = asNum(floor.height);
		const repeat =
			floor.isRepeated === true ? Math.max(1, asNum(floor.repeatCount)) : 1;

		if (floorType === "BASEMENT") hasBasement = true;
		if (floorType === "ROOF") {
			if (area > 0) roofArea = area;
		} else {
			if (floorType !== "BASEMENT") {
				totalFloorArea += area * repeat;
				exteriorWallHeight += height * repeat;
				if (area > 0) lastRegularArea = area;
			} else {
				totalFloorArea += area * repeat;
			}
			if (height > 0) {
				heightSum += height * repeat;
				heightCount += repeat;
			}
		}

		const rooms = Array.isArray(floor.rooms) ? (floor.rooms as RawRoom[]) : [];
		if (rooms.length > 0) {
			for (const room of rooms) {
				const length = asNum(room.length);
				const width = asNum(room.width);
				const roomType = typeof room.type === "string" ? room.type : "other";
				const floorArea = round(length * width, 4);
				const wallArea =
					height > 0 ? round(2 * (length + width) * height, 4) : null;
				spaces.push({
					name:
						typeof room.name === "string" && room.name
							? room.name
							: roomType,
					spaceType: "room",
					floorLabel: floorName || null,
					length: length || null,
					width: width || null,
					height: height || null,
					floorArea: floorArea || null,
					computedFloorArea: floorArea || null,
					computedWallArea: wallArea,
					isWetArea: WET_ROOM_TYPES.has(roomType),
					isExterior: false,
					sortOrder: spaceSort,
				});
				spaceSort += 10;
			}
		} else if (area > 0 && floorType !== "ROOF") {
			// دور بلا غرف — مساحة واحدة للدور كاملاً حتى لا يبقى الدرج فارغاً
			spaces.push({
				name: floorName || floorType || "دور",
				spaceType: "custom",
				floorLabel: floorName || null,
				length: null,
				width: null,
				height: height || null,
				floorArea: area,
				computedFloorArea: area,
				computedWallArea: null,
				isWetArea: false,
				isExterior: false,
				sortOrder: spaceSort,
			});
			spaceSort += 10;
		}

		const floorOpenings = Array.isArray(floor.openings)
			? (floor.openings as RawOpening[])
			: [];
		for (const opening of floorOpenings) {
			const width = asNum(opening.width);
			const oHeight = asNum(opening.height);
			const count = Math.max(1, asNum(opening.count) || 1);
			if (width <= 0 || oHeight <= 0) continue;
			const isExternal = opening.isExternal === true;
			openings.push({
				name:
					typeof opening.subType === "string" && opening.subType
						? opening.subType
						: opening.type === "window"
							? "نافذة"
							: "باب",
				openingType: opening.type === "window" ? "window" : "door",
				width,
				height: oHeight,
				computedArea: round(width * oHeight, 4),
				count,
				isExterior: isExternal,
				deductFromInteriorFinishes: !isExternal,
			});
		}
	}

	const perimeter = asNum(config.buildingPerimeter);
	const hasYard = config.hasCourtyard === true || config.hasGarden === true;
	const landPerimeter = asNum(config.landPerimeter);

	return {
		totalFloorArea: totalFloorArea > 0 ? round(totalFloorArea, 4) : null,
		totalExteriorWallArea:
			perimeter > 0 && exteriorWallHeight > 0
				? round(perimeter * exteriorWallHeight, 4)
				: null,
		totalRoofArea:
			roofArea > 0 ? roofArea : lastRegularArea > 0 ? lastRegularArea : null,
		totalPerimeter: perimeter > 0 ? perimeter : null,
		averageFloorHeight:
			heightCount > 0 ? round(heightSum / heightCount, 2) : null,
		hasBasement,
		// الإعداد القديم لا يحمل علم "بلا سطح" — نُبقي افتراض الـ schema (true)
		hasRoof: true,
		hasYard,
		yardArea: null,
		fenceLength: landPerimeter > 0 ? landPerimeter : null,
		spaces,
		openings,
	};
}

// ── نقطة الدخول: بناء خطة الترحيل الكاملة ────────────────────────

export function planLegacyMigration(
	input: MigrationPlanInput,
	catalogByKey: Map<string, CatalogLookupEntry>,
): MigrationPlan {
	// Idempotency guard: أي بنود موحَّدة موجودة → لا ترحيل مزدوج
	if (input.existingQuantityItemCount > 0) {
		return {
			skip: true,
			skipReason: "already_migrated",
			items: [],
			context: null,
			stats: {
				migratedFinishing: 0,
				migratedMep: 0,
				skipped: 0,
				unmatchedToManual: 0,
				spacesPlanned: 0,
				openingsPlanned: 0,
			},
		};
	}

	const items: PlannedQuantityItem[] = [];
	let skipped = 0;
	let sortOrder = 0;

	for (const row of input.finishingRows) {
		if (!row.isEnabled) {
			skipped++;
			continue;
		}
		items.push(
			planFinishingItem(row, catalogByKey, sortOrder, input.globalMarkupPercent),
		);
		sortOrder += 10;
	}

	for (const row of input.mepRows) {
		if (!row.isEnabled) {
			skipped++;
			continue;
		}
		items.push(
			planMepItem(row, catalogByKey, sortOrder, input.globalMarkupPercent),
		);
		sortOrder += 10;
	}

	const context = input.hasExistingContext
		? null
		: planContextFromBuildingConfig(input.buildingConfig);

	const migratedFinishing = items.filter(
		(i) => i.legacySource === "finishing",
	).length;
	const migratedMep = items.filter((i) => i.legacySource === "mep").length;
	const unmatchedToManual = items.filter((i) => !i.matched).length;

	return {
		skip: false,
		skipReason: null,
		items,
		context,
		stats: {
			migratedFinishing,
			migratedMep,
			skipped,
			unmatchedToManual,
			spacesPlanned: context?.spaces.length ?? 0,
			openingsPlanned: context?.openings.length ?? 0,
		},
	};
}
