// ══════════════════════════════════════════════════════════════
// Finishing Links — Derivation rules & auto-fill from BuildingConfig
// ══════════════════════════════════════════════════════════════

import type { BuildingConfig, FloorConfig } from "./finishing-types";

// ────────────────────────────────────────
// Link Source Types (stored in calculationData.linkedSource)
// ────────────────────────────────────────

export type DerivationType =
	| "floor_area" // مساحة الدور = floor.area
	| "wall_area" // مساحة الجدران = محيط الغرف × الارتفاع + مساحة السقف
	| "external_wall_area" // الجدران الخارجية = محيط المبنى × مجموع ارتفاعات الأدوار
	| "roof_area" // مساحة السطح = مساحة دور السطح
	| "roof_perimeter" // محيط السطح (دروة)
	| "yard_area" // مساحة الحوش = مساحة الأرض - مساحة المبنى
	| "thermal_wall_area" // عزل حراري جدران = محيط المبنى × مجموع الارتفاعات
	| "same_as_category"; // نفس كمية فئة أخرى

export interface LinkedSource {
	type: "building_config" | "category";
	derivation: DerivationType;
	floorId?: string;
	sourceCategoryId?: string;
	label: string;
}

// ────────────────────────────────────────
// Derivation Rules — what each category can derive from
// ────────────────────────────────────────

export interface DerivationOption {
	derivation: DerivationType;
	labelAr: string;
	sourceType: "building_config" | "category";
	sourceCategoryId?: string;
	requiresFloor?: boolean;
	unit: "m2" | "m" | "piece";
}

/**
 * Get available derivation options for a finishing category.
 */
export function getDerivationOptions(categoryId: string): DerivationOption[] {
	switch (categoryId) {
		// ═══ أعمال العزل ═══
		case "FINISHING_WATERPROOFING":
			return [
				{
					derivation: "roof_area",
					labelAr: "مساحة السطح (من إعدادات المبنى)",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "floor_area",
					labelAr: "مساحة الدور (من إعدادات المبنى)",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
			];

		case "FINISHING_THERMAL_INSULATION":
			return [
				{
					derivation: "roof_area",
					labelAr: "مساحة السطح = مساحة العزل المائي",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "thermal_wall_area",
					labelAr: "جدران خارجية (محيط المبنى × ارتفاع الأدوار)",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية العزل المائي (سطح)",
					sourceType: "category",
					sourceCategoryId: "FINISHING_WATERPROOFING",
					unit: "m2",
				},
			];

		// ═══ أعمال اللياسة ═══
		case "FINISHING_INTERNAL_PLASTER":
			return [
				{
					derivation: "wall_area",
					labelAr: "مساحة الجدران + السقف (من إعدادات المبنى)",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
			];

		case "FINISHING_EXTERNAL_PLASTER":
			return [
				{
					derivation: "external_wall_area",
					labelAr: "الجدران الخارجية (محيط المبنى × ارتفاع الأدوار)",
					sourceType: "building_config",
					unit: "m2",
				},
			];

		// ═══ أعمال الدهانات ═══
		case "FINISHING_INTERIOR_PAINT":
			return [
				{
					derivation: "wall_area",
					labelAr: "مساحة الجدران + السقف (من إعدادات المبنى)",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية اللياسة الداخلية (نفس الدور)",
					sourceType: "category",
					sourceCategoryId: "FINISHING_INTERNAL_PLASTER",
					unit: "m2",
				},
			];

		case "FINISHING_FACADE_PAINT":
			return [
				{
					derivation: "external_wall_area",
					labelAr: "الجدران الخارجية = اللياسة الخارجية",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية اللياسة الخارجية",
					sourceType: "category",
					sourceCategoryId: "FINISHING_EXTERNAL_PLASTER",
					unit: "m2",
				},
			];

		// ═══ أعمال الأرضيات ═══
		case "FINISHING_FLOOR_TILES":
			return [
				{
					derivation: "floor_area",
					labelAr: "مساحة الدور (من إعدادات المبنى)",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
			];

		// ═══ تكسيات الجدران ═══
		case "FINISHING_WALL_TILES":
			return [
				{
					derivation: "wall_area",
					labelAr: "مساحة جدران الدور (من إعدادات المبنى)",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
			];

		// ═══ الأسقف المستعارة ═══
		case "FINISHING_FALSE_CEILING":
			return [
				{
					derivation: "floor_area",
					labelAr: "مساحة الدور = مساحة الأرضيات",
					sourceType: "building_config",
					requiresFloor: true,
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية الأرضيات (نفس الدور)",
					sourceType: "category",
					sourceCategoryId: "FINISHING_FLOOR_TILES",
					unit: "m2",
				},
			];

		// ═══ أعمال الواجهات ═══
		case "FINISHING_STONE_FACADE":
			return [
				{
					derivation: "external_wall_area",
					labelAr: "الجدران الخارجية = اللياسة الخارجية",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية اللياسة الخارجية",
					sourceType: "category",
					sourceCategoryId: "FINISHING_EXTERNAL_PLASTER",
					unit: "m2",
				},
			];

		// ═══ أعمال السطح ═══
		case "FINISHING_ROOF":
			return [
				{
					derivation: "roof_area",
					labelAr: "مساحة السطح = العزل المائي = العزل الحراري",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية العزل المائي (سطح)",
					sourceType: "category",
					sourceCategoryId: "FINISHING_WATERPROOFING",
					unit: "m2",
				},
			];

		// ═══ الأعمال الخارجية ═══
		case "FINISHING_YARD_PAVING":
			return [
				{
					derivation: "yard_area",
					labelAr: "مساحة الحوش (مساحة الأرض - مساحة المبنى)",
					sourceType: "building_config",
					unit: "m2",
				},
			];

		case "FINISHING_LANDSCAPING":
			return [
				{
					derivation: "yard_area",
					labelAr: "مساحة الحوش (مساحة الأرض - مساحة المبنى)",
					sourceType: "building_config",
					unit: "m2",
				},
				{
					derivation: "same_as_category",
					labelAr: "نفس كمية أرضيات الحوش",
					sourceType: "category",
					sourceCategoryId: "FINISHING_YARD_PAVING",
					unit: "m2",
				},
			];

		default:
			return [];
	}
}

// ────────────────────────────────────────
// Quantity Computation
// ────────────────────────────────────────

/**
 * Compute a derived quantity from building config.
 */
export function computeDerivedQuantity(
	derivation: DerivationType,
	config: BuildingConfig,
	floorId?: string,
): number | null {
	switch (derivation) {
		case "floor_area": {
			if (!floorId) return null;
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor) return null;
			return floor.area;
		}

		case "wall_area": {
			if (!floorId) return null;
			const floor = config.floors.find((f) => f.id === floorId);
			if (!floor || !floor.area || !floor.height) return null;
			// Approximate wall perimeter from area (assuming roughly square)
			const side = Math.sqrt(floor.area);
			const wallPerimeter = side * 4;
			const wallArea = wallPerimeter * floor.height;
			const ceilingArea = floor.area;
			return Math.round(wallArea + ceilingArea);
		}

		case "external_wall_area": {
			if (!config.buildingPerimeter) return null;
			const totalHeight = config.floors
				.filter((f) => f.floorType !== "ROOF")
				.reduce(
					(sum, f) => sum + f.height * (f.isRepeated ? f.repeatCount : 1),
					0,
				);
			if (!totalHeight) return null;
			return Math.round(config.buildingPerimeter * totalHeight);
		}

		case "roof_area": {
			// Find ROOF floor, or last non-ROOF floor
			const roofFloor = config.floors.find((f) => f.floorType === "ROOF");
			if (roofFloor?.area) return roofFloor.area;
			// Fallback: use the area of the last non-roof floor
			const regularFloors = config.floors.filter(
				(f) => f.floorType !== "ROOF" && f.floorType !== "BASEMENT",
			);
			const lastFloor = regularFloors[regularFloors.length - 1];
			return lastFloor?.area ?? null;
		}

		case "roof_perimeter": {
			const roofArea = computeDerivedQuantity("roof_area", config);
			if (!roofArea) return null;
			// Approximate perimeter from area (assuming square)
			const side = Math.sqrt(roofArea);
			return Math.round(side * 4);
		}

		case "yard_area": {
			if (!config.totalLandArea) return null;
			const groundFloor = config.floors.find(
				(f) => f.floorType === "GROUND",
			);
			const buildingArea = groundFloor?.area ?? 0;
			const yardArea = config.totalLandArea - buildingArea;
			return yardArea > 0 ? Math.round(yardArea) : null;
		}

		case "thermal_wall_area":
			return computeDerivedQuantity("external_wall_area", config);

		case "same_as_category":
			// This is resolved by looking at existing items, not building config
			return null;

		default:
			return null;
	}
}

/**
 * Find quantity from existing items for "same_as_category" derivation.
 */
export function getQuantityFromCategory(
	sourceCategoryId: string,
	items: Array<{
		category: string;
		floorId?: string | null;
		area?: number | null;
		quantity?: number | null;
		length?: number | null;
	}>,
	floorId?: string,
): number | null {
	const matching = items.filter(
		(item) =>
			item.category === sourceCategoryId &&
			(!floorId || item.floorId === floorId),
	);

	if (matching.length === 0) return null;

	// Sum all matching items' quantities
	return matching.reduce((sum, item) => {
		return sum + (item.area ?? item.quantity ?? item.length ?? 0);
	}, 0);
}

// ────────────────────────────────────────
// Cascade Update — recalculate all linked items
// ────────────────────────────────────────

export interface FinishingItemForUpdate {
	id: string;
	category: string;
	floorId?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
	unit: string;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	calculationData?: Record<string, unknown> | null;
}

interface ItemUpdate {
	id: string;
	area?: number;
	quantity?: number;
	length?: number;
	totalCost: number;
	materialCost: number;
	laborCost: number;
}

/**
 * Compute cascade updates for all linked items after building config changes.
 * Returns a list of item updates to apply.
 */
export function computeCascadeUpdates(
	config: BuildingConfig,
	items: FinishingItemForUpdate[],
): ItemUpdate[] {
	const updates: ItemUpdate[] = [];

	for (const item of items) {
		const linked = item.calculationData?.linkedSource as LinkedSource | undefined;
		if (!linked) continue;

		if (linked.type !== "building_config") continue;

		const newQty = computeDerivedQuantity(
			linked.derivation,
			config,
			item.floorId ?? linked.floorId,
		);

		if (newQty == null) continue;

		const wastage = 1 + ((item.wastagePercent ?? 0) as number) / 100;
		const materialPrice = (item.materialPrice ?? 0) as number;
		const laborPrice = (item.laborPrice ?? 0) as number;
		const unitCost = materialPrice + laborPrice;

		if (item.unit === "lump_sum") continue;

		const totalCost = newQty * wastage * unitCost;
		const materialCost =
			unitCost > 0 ? totalCost * (materialPrice / unitCost) : 0;
		const laborCost =
			unitCost > 0 ? totalCost * (laborPrice / unitCost) : 0;

		const update: ItemUpdate = {
			id: item.id,
			totalCost: Math.round(totalCost),
			materialCost: Math.round(materialCost),
			laborCost: Math.round(laborCost),
		};

		// Set the correct quantity field based on unit
		if (item.unit === "m2") {
			update.area = newQty;
		} else if (item.unit === "m") {
			update.length = newQty;
		} else {
			update.quantity = newQty;
		}

		updates.push(update);
	}

	return updates;
}

/**
 * Check if a category has any available derivation options.
 */
export function hasDerivationOptions(categoryId: string): boolean {
	return getDerivationOptions(categoryId).length > 0;
}
