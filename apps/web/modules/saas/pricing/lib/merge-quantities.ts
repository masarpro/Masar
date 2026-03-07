import type { DerivedQuantity, DataSourceType } from "./smart-building-types";

// ══════════════════════════════════════════════════════════════
// Merge Quantities — combines derived (engine) + saved (DB)
// ══════════════════════════════════════════════════════════════

/** A finishing item as stored in the database */
export interface SavedFinishingItem {
	id: string;
	category: string;
	subCategory?: string | null;
	name?: string | null;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
	unit?: string | null;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	materialCost?: number | null;
	laborCost?: number | null;
	totalCost: number;
	dataSource?: string | null;
	sourceFormula?: string | null;
	isEnabled?: boolean | null;
	groupKey?: string | null;
	scope?: string | null;
	sortOrder?: number | null;
	calculationData?: Record<string, unknown> | null;
}

/** Merged item shown in the dashboard */
export interface MergedQuantityItem {
	/** Unique key for React rendering */
	key: string;
	/** DB id if saved, null if only derived */
	savedId: string | null;
	/** Whether this item exists in the database */
	isSaved: boolean;

	// Identity
	categoryKey: string;
	category: string;
	subCategory?: string;
	name: string;
	floorId?: string;
	floorName?: string;
	scope: string;
	groupKey: string;
	groupName: string;
	groupIcon: string;
	groupColor: string;

	// Quantities
	quantity: number;
	unit: string;
	wastagePercent: number;
	effectiveQuantity: number;

	// Source
	dataSource: DataSourceType;
	sourceDescription: string;
	sourceFormula?: string;
	sourceItemKey?: string;
	calculationBreakdown?: DerivedQuantity["calculationBreakdown"];

	// State
	isEnabled: boolean;
	sortOrder: number;

	// Original derived quantity (for "reset to auto" functionality)
	derivedQuantity?: number;
	derivedEffective?: number;

	// Flags
	isManualOverride: boolean;
	isStale: boolean;
}

/** Build a match key for comparing derived ↔ saved */
function matchKey(
	category: string,
	subCategory: string | undefined | null,
	floorId: string | undefined | null,
	scope: string | undefined | null,
): string {
	return `${category}|${subCategory ?? ""}|${floorId ?? ""}|${scope ?? ""}`;
}

/** Map DerivedQuantity.categoryKey to the DB category string */
function mapCategoryKey(key: string): string {
	const base = key.replace(/_[a-z0-9-]+$/, "");
	const MAP: Record<string, string> = {
		waterproofing_foundations: "FINISHING_WATERPROOFING",
		waterproofing_bathrooms: "FINISHING_WATERPROOFING",
		waterproofing_roof: "FINISHING_WATERPROOFING",
		thermal_walls: "FINISHING_THERMAL_INSULATION",
		thermal_roof: "FINISHING_THERMAL_INSULATION",
		internal_plaster: "FINISHING_INTERNAL_PLASTER",
		external_plaster: "FINISHING_EXTERNAL_PLASTER",
		interior_paint: "FINISHING_INTERIOR_PAINT",
		facade_paint: "FINISHING_FACADE_PAINT",
		boundary_paint: "FINISHING_BOUNDARY_PAINT",
		flooring: "FINISHING_FLOOR_TILES",
		wall_tiles_bathroom: "FINISHING_WALL_TILES",
		wall_tiles_kitchen: "FINISHING_WALL_TILES",
		false_ceiling: "FINISHING_FALSE_CEILING",
		interior_doors: "FINISHING_INTERIOR_DOORS",
		exterior_doors: "FINISHING_EXTERIOR_DOORS",
		windows: "FINISHING_WINDOWS",
		bathroom_fixtures: "FINISHING_BATHROOMS",
		vanities: "FINISHING_MARBLE_VANITIES",
		kitchen_cabinets: "FINISHING_KITCHEN",
		internal_stairs: "FINISHING_INTERNAL_STAIRS",
		external_stairs: "FINISHING_EXTERNAL_STAIRS",
		railings: "FINISHING_RAILINGS",
		stone_facade: "FINISHING_STONE_FACADE",
		facade_decor: "FINISHING_FACADE_DECOR",
		yard_paving: "FINISHING_YARD_PAVING",
		fence_gates: "FINISHING_FENCE_GATES",
		landscaping: "FINISHING_LANDSCAPING",
		roof_finishing: "FINISHING_ROOF",
		interior_decor: "FINISHING_INTERIOR_DECOR",
	};
	return MAP[base] ?? MAP[key] ?? key;
}

/** Get display name for a category key */
function getCategoryName(key: string): string {
	const NAMES: Record<string, string> = {
		waterproofing_foundations: "عزل مائي — أساسات",
		waterproofing_roof: "عزل مائي — سطح",
		thermal_walls: "عزل حراري — جدران",
		thermal_roof: "عزل حراري — سطح",
		external_plaster: "لياسة خارجية",
		facade_paint: "دهان واجهات",
		boundary_paint: "دهان سور",
		interior_doors: "أبواب داخلية",
		exterior_doors: "أبواب خارجية",
		windows: "نوافذ ألمنيوم",
		bathroom_fixtures: "تجهيز حمامات",
		vanities: "مغاسل ورخاميات",
		kitchen_cabinets: "خزائن مطبخ",
		internal_stairs: "تكسية درج داخلي",
		external_stairs: "تكسية درج خارجي",
		railings: "درابزين وحواجز",
		stone_facade: "تكسيات واجهات",
		facade_decor: "زخارف واجهات",
		yard_paving: "أرضيات حوش",
		fence_gates: "بوابات سور",
		landscaping: "تنسيق حدائق",
		roof_finishing: "تشطيبات سطح",
		interior_decor: "ديكورات داخلية",
	};

	if (key.startsWith("waterproofing_bathrooms_"))
		return "عزل مائي — حمامات";
	if (key.startsWith("internal_plaster_")) return "لياسة داخلية";
	if (key.startsWith("interior_paint_")) return "دهان داخلي";
	if (key.startsWith("flooring_")) return "أرضيات";
	if (key.startsWith("wall_tiles_bathroom_"))
		return "تكسيات جدران حمامات";
	if (key.startsWith("wall_tiles_kitchen_"))
		return "سبلاش باك مطبخ";
	if (key.startsWith("false_ceiling_")) return "أسقف مستعارة";

	return NAMES[key] ?? key;
}

/** Get sub-category from derivation key */
function getSubCategory(key: string): string | undefined {
	const SUB: Record<string, string> = {
		waterproofing_foundations: "WP_FOUNDATIONS",
		waterproofing_roof: "WP_ROOF",
		thermal_walls: "TI_WALLS",
		thermal_roof: "TI_ROOF",
	};
	if (key.startsWith("waterproofing_bathrooms_")) return "WP_BATHROOMS";
	return SUB[key];
}

/**
 * Merge derived quantities (from engine) with saved items (from DB).
 *
 * Rules:
 * - If item in both saved & derived: use saved values (user may have overridden)
 * - If item only in derived: add as new unsaved item
 * - If item only in saved: keep as manual item
 * - Match key: category + subCategory + floorId + scope
 */
export function mergeQuantities(
	derived: DerivedQuantity[],
	saved: SavedFinishingItem[],
): MergedQuantityItem[] {
	const result: MergedQuantityItem[] = [];

	// Index saved items by match key
	const savedByKey = new Map<string, SavedFinishingItem>();
	for (const item of saved) {
		const key = matchKey(
			item.category,
			item.subCategory,
			item.floorId,
			item.scope,
		);
		savedByKey.set(key, item);
	}

	// Track which saved items were matched
	const matchedSavedIds = new Set<string>();

	// Process derived items
	let sortOrder = 0;
	for (const d of derived) {
		const category = mapCategoryKey(d.categoryKey);
		const subCategory = d.subCategory ?? getSubCategory(d.categoryKey);
		const key = matchKey(category, subCategory, d.floorId, d.scope);
		const savedItem = savedByKey.get(key);

		if (savedItem) {
			matchedSavedIds.add(savedItem.id);
			const savedQty = getQuantityFromSaved(savedItem);
			const isManualOverride =
				savedItem.dataSource === "manual" &&
				Math.abs(savedQty - d.quantity) > 0.01;

			result.push({
				key: `${d.categoryKey}_${d.floorId ?? "all"}`,
				savedId: savedItem.id,
				isSaved: true,
				categoryKey: d.categoryKey,
				category,
				subCategory,
				name: savedItem.name ?? getCategoryName(d.categoryKey),
				floorId: d.floorId,
				floorName: d.floorName,
				scope: d.scope,
				groupKey: d.groupKey,
				groupName: d.groupName,
				groupIcon: d.groupIcon,
				groupColor: d.groupColor,
				quantity: savedQty,
				unit: savedItem.unit ?? d.unit,
				wastagePercent:
					savedItem.wastagePercent != null
						? savedItem.wastagePercent
						: d.wastagePercent,
				effectiveQuantity: calcEffective(
					savedQty,
					savedItem.wastagePercent ?? d.wastagePercent,
				),
				dataSource:
					(savedItem.dataSource as DataSourceType) ?? d.dataSource,
				sourceDescription: d.sourceDescription,
				sourceFormula: savedItem.sourceFormula ?? d.calculationBreakdown?.formula,
				sourceItemKey: d.sourceItemKey,
				calculationBreakdown: d.calculationBreakdown,
				isEnabled: savedItem.isEnabled ?? true,
				sortOrder: sortOrder++,
				derivedQuantity: d.quantity,
				derivedEffective: d.effectiveQuantity,
				isManualOverride,
				isStale: isManualOverride,
			});
		} else {
			// Derived only — not yet saved
			result.push({
				key: `${d.categoryKey}_${d.floorId ?? "all"}`,
				savedId: null,
				isSaved: false,
				categoryKey: d.categoryKey,
				category,
				subCategory,
				name: getCategoryName(d.categoryKey),
				floorId: d.floorId,
				floorName: d.floorName,
				scope: d.scope,
				groupKey: d.groupKey,
				groupName: d.groupName,
				groupIcon: d.groupIcon,
				groupColor: d.groupColor,
				quantity: d.quantity,
				unit: d.unit,
				wastagePercent: d.wastagePercent,
				effectiveQuantity: d.effectiveQuantity,
				dataSource: d.dataSource,
				sourceDescription: d.sourceDescription,
				sourceFormula: d.calculationBreakdown?.formula,
				sourceItemKey: d.sourceItemKey,
				calculationBreakdown: d.calculationBreakdown,
				isEnabled: d.isEnabled,
				sortOrder: sortOrder++,
				derivedQuantity: d.quantity,
				derivedEffective: d.effectiveQuantity,
				isManualOverride: false,
				isStale: false,
			});
		}
	}

	// Add saved-only items (manual entries not in derived)
	for (const item of saved) {
		if (matchedSavedIds.has(item.id)) continue;

		const savedQty = getQuantityFromSaved(item);
		result.push({
			key: `saved_${item.id}`,
			savedId: item.id,
			isSaved: true,
			categoryKey: item.category,
			category: item.category,
			subCategory: item.subCategory ?? undefined,
			name: item.name ?? item.category,
			floorId: item.floorId ?? undefined,
			floorName: item.floorName ?? undefined,
			scope: item.scope ?? "whole_building",
			groupKey: item.groupKey ?? "OTHER",
			groupName: "أخرى",
			groupIcon: "Package",
			groupColor: "gray",
			quantity: savedQty,
			unit: item.unit ?? "m2",
			wastagePercent: item.wastagePercent ?? 0,
			effectiveQuantity: calcEffective(savedQty, item.wastagePercent ?? 0),
			dataSource: (item.dataSource as DataSourceType) ?? "manual",
			sourceDescription: "إدخال يدوي",
			sourceFormula: item.sourceFormula ?? undefined,
			isEnabled: item.isEnabled ?? true,
			sortOrder: sortOrder++,
			isManualOverride: false,
			isStale: false,
		});
	}

	return result;
}

function getQuantityFromSaved(item: SavedFinishingItem): number {
	if (item.area != null && item.area > 0) return item.area;
	if (item.length != null && item.length > 0) return item.length;
	if (item.quantity != null && item.quantity > 0) return item.quantity;
	return 0;
}

function calcEffective(qty: number, wastage: number): number {
	return Math.round(qty * (1 + wastage / 100) * 100) / 100;
}

/** Group merged items by their groupKey, preserving order */
export function groupMergedItems(
	items: MergedQuantityItem[],
): Array<{
	groupKey: string;
	groupName: string;
	groupIcon: string;
	groupColor: string;
	items: MergedQuantityItem[];
}> {
	const groups = new Map<
		string,
		{
			groupKey: string;
			groupName: string;
			groupIcon: string;
			groupColor: string;
			items: MergedQuantityItem[];
		}
	>();

	for (const item of items) {
		const existing = groups.get(item.groupKey);
		if (existing) {
			existing.items.push(item);
		} else {
			groups.set(item.groupKey, {
				groupKey: item.groupKey,
				groupName: item.groupName,
				groupIcon: item.groupIcon,
				groupColor: item.groupColor,
				items: [item],
			});
		}
	}

	return Array.from(groups.values());
}
