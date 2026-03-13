import type {
	SmartBuildingConfig,
	SmartFloorConfig,
	RoomConfig,
	OpeningConfig,
	RoomType,
	DerivedQuantity,
} from "./smart-building-types";
import { deriveAllQuantities } from "./derivation-engine";

// ══════════════════════════════════════════════════════════════
// Knowledge Extractor — extracts building data from manual items
// ══════════════════════════════════════════════════════════════

/** A finishing item shape (subset of what we need) */
export interface ExtractableItem {
	category: string;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	quantity?: number | null;
	unit?: string | null;
	calculationMethod?: string | null;
	calculationData?: Record<string, unknown> | null;
	dataSource?: string | null;
}

export interface ExtractionResult {
	updatedConfig: Partial<SmartBuildingConfig>;
	newDerivedItems: DerivedQuantity[];
	notification: string;
}

/**
 * Extracts building knowledge from a manually-entered finishing item.
 * Updates building config and derives new items from the extracted data.
 *
 * Returns null if no knowledge can be extracted.
 */
export function extractKnowledgeFromItem(
	item: ExtractableItem,
	currentConfig: SmartBuildingConfig | null,
): ExtractionResult | null {
	const method = item.calculationMethod ?? "";
	const data = item.calculationData ?? {};
	const category = item.category;

	// Only extract from manual/user-entered items
	if (
		item.dataSource === "auto_building" ||
		item.dataSource === "auto_linked" ||
		item.dataSource === "auto_derived"
	) {
		return null;
	}

	// Try each extraction scenario
	const result =
		extractFromPlaster(item, category, method, data, currentConfig) ??
		extractFromPaint(item, category, method, data, currentConfig) ??
		extractFromFlooring(item, category, method, data, currentConfig) ??
		extractFromExternalPlaster(
			item,
			category,
			method,
			data,
			currentConfig,
		);

	return result;
}

// ══════════════════════════════════════════════════════════════
// Scenario 1: Internal plaster (rooms + openings → many items)
// ══════════════════════════════════════════════════════════════

function extractFromPlaster(
	item: ExtractableItem,
	category: string,
	method: string,
	data: Record<string, unknown>,
	currentConfig: SmartBuildingConfig | null,
): ExtractionResult | null {
	if (
		category !== "FINISHING_INTERNAL_PLASTER" ||
		(method !== "WALL_DEDUCTION" &&
			method !== "plaster_professional" &&
			method !== "ROOM_BY_ROOM")
	) {
		return null;
	}

	const rooms = extractRoomsFromData(data, method);
	const openings = extractOpeningsFromData(data, method);

	if (rooms.length === 0 && openings.length === 0) return null;
	if (!item.floorId) return null;

	const updatedConfig = applyExtractedData(
		currentConfig,
		item.floorId,
		item.floorName ?? undefined,
		rooms,
		openings,
	);

	if (!updatedConfig) return null;

	// Derive new items from updated config
	const fullConfig = buildFullConfig(currentConfig, updatedConfig);
	const allDerived = deriveAllQuantities(fullConfig);

	// Filter to items related to this floor that are NEW
	const floorId = item.floorId;
	const newItems = allDerived.filter(
		(d) =>
			d.floorId === floorId &&
			d.categoryKey !== `internal_plaster_${floorId}` &&
			d.isEnabled,
	);

	if (newItems.length === 0) return null;

	const floorName = item.floorName ?? "الدور";
	const itemList = newItems
		.map((d) => `${getItemName(d.categoryKey)} (${round(d.quantity)} ${getUnit(d.unit)})`)
		.join("، ");

	return {
		updatedConfig,
		newDerivedItems: newItems,
		notification: `تم حفظ بيانات الغرف لـ${floorName}. يمكن حساب ${newItems.length} بنود إضافية: ${itemList}`,
	};
}

// ══════════════════════════════════════════════════════════════
// Scenario 2: Paint (rooms + openings → plaster estimate)
// ══════════════════════════════════════════════════════════════

function extractFromPaint(
	item: ExtractableItem,
	category: string,
	method: string,
	data: Record<string, unknown>,
	currentConfig: SmartBuildingConfig | null,
): ExtractionResult | null {
	if (
		category !== "FINISHING_INTERIOR_PAINT" ||
		(method !== "paint_professional" &&
			method !== "WALL_DEDUCTION" &&
			method !== "ROOM_BY_ROOM")
	) {
		return null;
	}

	const rooms = extractRoomsFromData(data, method);
	const openings = extractOpeningsFromData(data, method);

	if (rooms.length === 0) return null;
	if (!item.floorId) return null;

	const updatedConfig = applyExtractedData(
		currentConfig,
		item.floorId,
		item.floorName ?? undefined,
		rooms,
		openings,
	);

	if (!updatedConfig) return null;

	const fullConfig = buildFullConfig(currentConfig, updatedConfig);
	const allDerived = deriveAllQuantities(fullConfig);

	const floorId = item.floorId;
	const newItems = allDerived.filter(
		(d) =>
			d.floorId === floorId &&
			d.categoryKey !== `interior_paint_${floorId}` &&
			d.isEnabled,
	);

	if (newItems.length === 0) return null;

	const floorName = item.floorName ?? "الدور";
	const itemList = newItems
		.map((d) => `${getItemName(d.categoryKey)} (${round(d.quantity)} ${getUnit(d.unit)})`)
		.join("، ");

	return {
		updatedConfig,
		newDerivedItems: newItems,
		notification: `تم حفظ بيانات الغرف من الدهان لـ${floorName}. يمكن حساب ${newItems.length} بنود: ${itemList}`,
	};
}

// ══════════════════════════════════════════════════════════════
// Scenario 3: Flooring (rooms → false ceiling, plaster estimate)
// ══════════════════════════════════════════════════════════════

function extractFromFlooring(
	item: ExtractableItem,
	category: string,
	method: string,
	data: Record<string, unknown>,
	currentConfig: SmartBuildingConfig | null,
): ExtractionResult | null {
	if (
		category !== "FINISHING_FLOOR_TILES" ||
		method !== "ROOM_BY_ROOM"
	) {
		return null;
	}

	const rooms = extractRoomsFromData(data, method);
	if (rooms.length === 0) return null;
	if (!item.floorId) return null;

	const updatedConfig = applyExtractedData(
		currentConfig,
		item.floorId,
		item.floorName ?? undefined,
		rooms,
		[],
	);

	if (!updatedConfig) return null;

	const fullConfig = buildFullConfig(currentConfig, updatedConfig);
	const allDerived = deriveAllQuantities(fullConfig);

	const floorId = item.floorId;
	const newItems = allDerived.filter(
		(d) =>
			d.floorId === floorId &&
			d.categoryKey !== `flooring_${floorId}` &&
			d.isEnabled,
	);

	if (newItems.length === 0) return null;

	const floorName = item.floorName ?? "الدور";
	const itemList = newItems
		.map((d) => `${getItemName(d.categoryKey)} (${round(d.quantity)} ${getUnit(d.unit)})`)
		.join("، ");

	return {
		updatedConfig,
		newDerivedItems: newItems,
		notification: `تم حفظ بيانات الغرف من الأرضيات لـ${floorName}. يمكن حساب ${newItems.length} بنود: ${itemList}`,
	};
}

// ══════════════════════════════════════════════════════════════
// Scenario 4: External plaster (perimeter + height → facade, thermal)
// ══════════════════════════════════════════════════════════════

function extractFromExternalPlaster(
	item: ExtractableItem,
	category: string,
	method: string,
	data: Record<string, unknown>,
	currentConfig: SmartBuildingConfig | null,
): ExtractionResult | null {
	if (
		category !== "FINISHING_EXTERNAL_PLASTER" ||
		(method !== "WALL_DEDUCTION" && method !== "plaster_professional")
	) {
		return null;
	}

	const wallPerimeter =
		typeof data.wallPerimeter === "number"
			? data.wallPerimeter
			: undefined;
	const wallHeight =
		typeof data.wallHeight === "number"
			? data.wallHeight
			: typeof data.floorHeight === "number"
				? data.floorHeight
				: undefined;

	if (!wallPerimeter && !wallHeight) return null;

	const updatedConfig: Partial<SmartBuildingConfig> = {};
	const cfg = currentConfig ?? {
		totalLandArea: 0,
		buildingPerimeter: 0,
		floors: [],
	};

	let changed = false;

	// Update building perimeter if not already set
	if (wallPerimeter && (!cfg.buildingPerimeter || cfg.buildingPerimeter === 0)) {
		updatedConfig.buildingPerimeter = wallPerimeter;
		changed = true;
	}

	if (!changed) return null;

	const fullConfig = buildFullConfig(currentConfig, updatedConfig);
	const allDerived = deriveAllQuantities(fullConfig);

	// New whole-building / external items
	const newItems = allDerived.filter(
		(d) =>
			(d.scope === "whole_building" || d.scope === "external") &&
			d.categoryKey !== "external_plaster" &&
			d.isEnabled,
	);

	if (newItems.length === 0) return null;

	const itemList = newItems
		.slice(0, 4)
		.map((d) => `${getItemName(d.categoryKey)} (${round(d.quantity)} ${getUnit(d.unit)})`)
		.join("، ");

	return {
		updatedConfig,
		newDerivedItems: newItems,
		notification: `تم استنتاج محيط المبنى (${wallPerimeter} م.ط). يمكن حساب ${newItems.length} بنود: ${itemList}`,
	};
}

// ══════════════════════════════════════════════════════════════
// Data extraction helpers
// ══════════════════════════════════════════════════════════════

/** Extract room configs from calculationData */
function extractRoomsFromData(
	data: Record<string, unknown>,
	method: string,
): RoomConfig[] {
	const rawRooms = data.rooms as
		| Array<Record<string, unknown>>
		| undefined;
	if (!rawRooms || !Array.isArray(rawRooms) || rawRooms.length === 0) {
		return [];
	}

	return rawRooms.map((r, i) => {
		// Plaster/paint professional format: { name, wall1, wall2, ... }
		// ROOM_BY_ROOM format: { name, length, width, area }
		const name =
			typeof r.name === "string"
				? r.name
				: `غرفة ${i + 1}`;
		const length =
			typeof r.length === "number"
				? r.length
				: typeof r.wall1 === "number"
					? r.wall1
					: 0;
		const width =
			typeof r.width === "number"
				? r.width
				: typeof r.wall2 === "number"
					? r.wall2
					: 0;
		const type = guessRoomType(name);

		return {
			id: crypto.randomUUID(),
			name,
			length,
			width,
			type,
			hasFalseCeiling: true,
		};
	});
}

/** Extract openings from calculationData */
function extractOpeningsFromData(
	data: Record<string, unknown>,
	method: string,
): OpeningConfig[] {
	const results: OpeningConfig[] = [];

	// Plaster/paint professional format: doors[] and windows[]
	const rawDoors = data.doors as
		| Array<Record<string, unknown>>
		| undefined;
	const rawWindows = data.windows as
		| Array<Record<string, unknown>>
		| undefined;

	if (rawDoors && Array.isArray(rawDoors)) {
		for (const d of rawDoors) {
			const width = typeof d.width === "number" ? d.width : 0.9;
			const height = typeof d.height === "number" ? d.height : 2.1;
			const count = typeof d.count === "number" ? d.count : 1;
			const name = typeof d.name === "string" ? d.name : "باب";
			results.push({
				id: crypto.randomUUID(),
				type: "door",
				subType: name,
				width,
				height,
				count,
				isExternal: name.includes("رئيسي") || name.includes("خارجي"),
			});
		}
	}

	if (rawWindows && Array.isArray(rawWindows)) {
		for (const w of rawWindows) {
			const width = typeof w.width === "number" ? w.width : 1.2;
			const height = typeof w.height === "number" ? w.height : 1.2;
			const count = typeof w.count === "number" ? w.count : 1;
			const name = typeof w.name === "string" ? w.name : "نافذة";
			results.push({
				id: crypto.randomUUID(),
				type: "window",
				subType: name,
				width,
				height,
				count,
				isExternal: true,
			});
		}
	}

	// Generic WALL_DEDUCTION format: deductions[]
	if (results.length === 0) {
		const deductions = data.deductions as
			| Array<Record<string, unknown>>
			| undefined;
		if (deductions && Array.isArray(deductions)) {
			for (const d of deductions) {
				const dtype = typeof d.type === "string" ? d.type : "custom";
				const width =
					typeof d.width === "number" ? d.width : 0.9;
				const height =
					typeof d.height === "number" ? d.height : 2.1;
				const count =
					typeof d.count === "number" ? d.count : 1;
				const isDoor =
					dtype.includes("Door") ||
					dtype.includes("door") ||
					dtype.includes("باب");
				results.push({
					id: crypto.randomUUID(),
					type: isDoor ? "door" : "window",
					subType: deductionTypeToName(dtype),
					width,
					height,
					count,
					isExternal:
						dtype.includes("main") ||
						dtype.includes("رئيسي") ||
						!isDoor,
				});
			}
		}
	}

	return results;
}

/** Guess room type from Arabic name */
function guessRoomType(name: string): RoomType {
	const n = name.toLowerCase();
	if (n.includes("حمام") || n.includes("wc") || n.includes("bath"))
		return "bathroom";
	if (n.includes("مطبخ") || n.includes("kitchen")) return "kitchen";
	if (n.includes("نوم") || n.includes("bed")) return "bedroom";
	if (n.includes("صالة") || n.includes("living") || n.includes("معيشة"))
		return "living";
	if (n.includes("مجلس") || n.includes("majlis")) return "majlis";
	if (n.includes("ممر") || n.includes("hall") || n.includes("corridor"))
		return "corridor";
	if (n.includes("مخزن") || n.includes("storage")) return "storage";
	if (n.includes("مغسلة") || n.includes("غسيل") || n.includes("laundry"))
		return "laundry";
	if (n.includes("خادمة") || n.includes("maid")) return "maid_room";
	return "other";
}

/** Map deduction type codes to readable names */
function deductionTypeToName(type: string): string {
	const map: Record<string, string> = {
		standardDoor: "باب عادي",
		bathroomDoor: "باب حمام",
		mainDoor: "باب رئيسي",
		largeWindow: "نافذة كبيرة",
		mediumWindow: "نافذة متوسطة",
		smallWindow: "نافذة صغيرة",
	};
	return map[type] ?? type;
}

// ══════════════════════════════════════════════════════════════
// Config update helpers
// ══════════════════════════════════════════════════════════════

/**
 * Apply extracted rooms/openings to a floor in the config.
 * Does NOT overwrite existing data — only adds if missing.
 */
function applyExtractedData(
	currentConfig: SmartBuildingConfig | null,
	floorId: string,
	floorName: string | undefined,
	rooms: RoomConfig[],
	openings: OpeningConfig[],
): Partial<SmartBuildingConfig> | null {
	const cfg = currentConfig ?? {
		totalLandArea: 0,
		buildingPerimeter: 0,
		floors: [],
	};

	const floor = cfg.floors.find((f) => f.id === floorId);
	if (!floor) return null;

	// Don't overwrite existing rooms/openings
	const existingRooms = floor.rooms ?? [];
	const existingOpenings = floor.openings ?? [];

	if (existingRooms.length > 0 && existingOpenings.length > 0) {
		// Floor already has both rooms and openings, nothing new to add
		return null;
	}

	const updatedFloor: SmartFloorConfig = { ...floor };
	let changed = false;

	if (existingRooms.length === 0 && rooms.length > 0) {
		updatedFloor.rooms = rooms;
		changed = true;
	}

	if (existingOpenings.length === 0 && openings.length > 0) {
		updatedFloor.openings = openings;
		changed = true;
	}

	if (!changed) return null;

	return {
		floors: cfg.floors.map((f) =>
			f.id === floorId ? updatedFloor : f,
		),
	};
}

/** Build a full config by merging current + updates */
function buildFullConfig(
	current: SmartBuildingConfig | null,
	updates: Partial<SmartBuildingConfig>,
): SmartBuildingConfig {
	const base = current ?? {
		totalLandArea: 0,
		buildingPerimeter: 0,
		floors: [],
	};
	return { ...base, ...updates };
}

// ══════════════════════════════════════════════════════════════
// Display helpers
// ══════════════════════════════════════════════════════════════

function getItemName(key: string): string {
	const names: Record<string, string> = {
		waterproofing_foundations: "عزل مائي أساسات",
		waterproofing_roof: "عزل مائي سطح",
		thermal_walls: "عزل حراري جدران",
		thermal_roof: "عزل حراري سطح",
		external_plaster: "لياسة خارجية",
		facade_paint: "دهان واجهات",
		boundary_paint: "دهان سور",
		interior_doors: "أبواب داخلية",
		exterior_doors: "أبواب خارجية",
		windows: "نوافذ",
		bathroom_fixtures: "تجهيز حمامات",
		vanities: "مغاسل ورخاميات",
		kitchen_cabinets: "خزائن مطبخ",
		internal_stairs: "درج داخلي",
		external_stairs: "درج خارجي",
		railings: "درابزين",
		stone_facade: "واجهات حجرية",
		yard_paving: "أرضيات حوش",
		fence_gates: "بوابات سور",
		landscaping: "تنسيق حدائق",
		roof_finishing: "تشطيبات سطح",
	};

	// Floor-specific keys
	if (key.startsWith("internal_plaster_")) return "لياسة داخلية";
	if (key.startsWith("interior_paint_")) return "دهان داخلي";
	if (key.startsWith("flooring_")) return "أرضيات";
	if (key.startsWith("wall_tiles_bathroom_")) return "بلاط جدران حمامات";
	if (key.startsWith("wall_tiles_kitchen_")) return "سبلاش باك مطبخ";
	if (key.startsWith("false_ceiling_")) return "أسقف مستعارة";
	if (key.startsWith("waterproofing_bathrooms_")) return "عزل حمامات";

	return names[key] ?? key;
}

function getUnit(unit: string): string {
	const units: Record<string, string> = {
		m2: "م²",
		m: "م.ط",
		unit: "عدد",
		set: "طقم",
	};
	return units[unit] ?? unit;
}

function round(n: number): string {
	return (Math.round(n * 10) / 10).toLocaleString("en-US");
}
