import { FINISHING_GROUPS } from "./finishing-categories";
import type {
	SmartBuildingConfig,
	SmartFloorConfig,
	DerivedQuantity,
	DataSourceType,
	CalculationBreakdown,
} from "./smart-building-types";
import {
	TILED_WALL_ROOMS,
	SPLASH_BACK_ROOMS,
	DEFAULT_SPLASH_BACK_HEIGHT,
} from "./smart-building-types";

// ══════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════

export function estimatePerimeterFromArea(
	area: number,
	wallMultiplier = 1.3,
): number {
	return Math.sqrt(area) * 4 * wallMultiplier;
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

function makeEffective(qty: number, wastage: number): number {
	return round2(qty * (1 + wastage / 100));
}

function group(key: string) {
	const g = FINISHING_GROUPS[key];
	return {
		groupKey: g.id,
		groupName: g.nameAr,
		groupIcon: g.icon,
		groupColor: g.color,
	};
}

function getRoofArea(config: SmartBuildingConfig): number {
	const roofFloor = config.floors.find((f) => f.floorType === "ROOF");
	if (roofFloor?.area) return roofFloor.area;
	const regular = config.floors.filter(
		(f) => f.floorType !== "ROOF" && f.floorType !== "BASEMENT",
	);
	return regular[regular.length - 1]?.area ?? 0;
}

function getTotalExternalWallHeight(config: SmartBuildingConfig): number {
	return config.floors
		.filter((f) => f.floorType !== "ROOF")
		.reduce(
			(sum, f) => sum + f.height * (f.isRepeated ? f.repeatCount : 1),
			0,
		);
}

function getFloorRoomsByType(floor: SmartFloorConfig, type: string) {
	return (floor.rooms ?? []).filter((r) => r.type === type);
}

function getFloorOpenings(
	floor: SmartFloorConfig,
	filter: { type?: "door" | "window"; isExternal?: boolean },
) {
	return (floor.openings ?? []).filter((o) => {
		if (filter.type !== undefined && o.type !== filter.type) return false;
		if (filter.isExternal !== undefined && o.isExternal !== filter.isExternal)
			return false;
		return true;
	});
}

function sumOpeningsArea(
	openings: Array<{ width: number; height: number; count: number }>,
): number {
	return openings.reduce((s, o) => s + o.width * o.height * o.count, 0);
}

function sumOpeningsCount(
	openings: Array<{ count: number }>,
): number {
	return openings.reduce((s, o) => s + o.count, 0);
}

/** Floors that are habitable (not ROOF) */
function habitableFloors(config: SmartBuildingConfig): SmartFloorConfig[] {
	return config.floors.filter((f) => f.floorType !== "ROOF");
}

function upperFloorCount(config: SmartBuildingConfig): number {
	return config.floors
		.filter((f) => f.floorType === "UPPER" || f.floorType === "ANNEX")
		.reduce((sum, f) => sum + (f.isRepeated ? f.repeatCount : 1), 0);
}

// ══════════════════════════════════════════════════════════════
// Internal Plaster Calculation — used by multiple groups
// ══════════════════════════════════════════════════════════════

interface PlasterResult {
	wallArea: number;
	ceilingArea: number;
	totalArea: number;
	bathroomWallArea: number;
	internalOpeningsArea: number;
	dataSource: DataSourceType;
	breakdown: CalculationBreakdown;
}

function calcInternalPlaster(
	floor: SmartFloorConfig,
): PlasterResult {
	const hasRooms = (floor.rooms ?? []).length > 0;

	if (hasRooms) {
		const rooms = floor.rooms!;
		let totalWallArea = 0;
		let totalCeilingArea = 0;
		let bathroomWallArea = 0;

		for (const room of rooms) {
			const perimeter = (room.length + room.width) * 2;
			const wallArea = perimeter * floor.height;
			totalWallArea += wallArea;
			totalCeilingArea += room.length * room.width;
			if (TILED_WALL_ROOMS.includes(room.type)) {
				bathroomWallArea += wallArea;
			}
		}

		const internalOpenings = getFloorOpenings(floor, { isExternal: false });
		const internalOpeningsArea = sumOpeningsArea(internalOpenings);

		const netWallArea = Math.max(
			0,
			totalWallArea - internalOpeningsArea - bathroomWallArea,
		);
		const totalArea = netWallArea + totalCeilingArea;

		return {
			wallArea: round2(netWallArea),
			ceilingArea: round2(totalCeilingArea),
			totalArea: round2(totalArea),
			bathroomWallArea: round2(bathroomWallArea),
			internalOpeningsArea: round2(internalOpeningsArea),
			dataSource: "auto_building",
			breakdown: {
				type: "room_by_room",
				details: {
					rooms: rooms.map((r) => ({
						name: r.name,
						wallArea: round2((r.length + r.width) * 2 * floor.height),
						floorArea: round2(r.length * r.width),
					})),
					bathroom_wall_area: round2(bathroomWallArea),
					internal_openings_area: round2(internalOpeningsArea),
				},
				formula: `مجموع جدران الغرف (${rooms.length} غرفة) × ارتفاع ${floor.height}م - فتحات داخلية (${round2(internalOpeningsArea)} م²) - جدران حمامات (${round2(bathroomWallArea)} م²) + أسقف (${round2(totalCeilingArea)} م²)`,
			},
		};
	}

	// Estimated: no rooms
	const estPerimeter = estimatePerimeterFromArea(floor.area);
	const wallArea = round2(estPerimeter * floor.height);
	const ceilingArea = floor.area;
	const totalArea = round2(wallArea + ceilingArea);

	return {
		wallArea,
		ceilingArea,
		totalArea,
		bathroomWallArea: 0,
		internalOpeningsArea: 0,
		dataSource: "estimated",
		breakdown: {
			type: "wall_deduction",
			details: {
				estimated_perimeter: round2(estPerimeter),
				bathroom_wall_area: 0,
			},
			formula: `تقديري: محيط مقدّر (${round2(estPerimeter)} م.ط) × ارتفاع ${floor.height}م + سقف (${ceilingArea} م²)`,
		},
	};
}

// ══════════════════════════════════════════════════════════════
// Main Derivation Function
// ══════════════════════════════════════════════════════════════

export function deriveAllQuantities(
	config: SmartBuildingConfig,
): DerivedQuantity[] {
	if (!config.floors || config.floors.length === 0) return [];

	const results: DerivedQuantity[] = [];
	const plasterCache = new Map<string, PlasterResult>();

	// Pre-calculate internal plaster for each habitable floor
	for (const floor of habitableFloors(config)) {
		plasterCache.set(floor.id, calcInternalPlaster(floor));
	}

	// ── Group 1: Insulation ──────────────────────────────

	deriveInsulation(config, plasterCache, results);

	// ── Group 2: Plastering ──────────────────────────────

	derivePlastering(config, plasterCache, results);

	// ── Group 3: Painting ────────────────────────────────

	derivePainting(config, plasterCache, results);

	// ── Group 4: Flooring ────────────────────────────────

	deriveFlooring(config, results);

	// ── Group 5: Wall Cladding ───────────────────────────

	deriveWallCladding(config, plasterCache, results);

	// ── Group 6: False Ceiling ───────────────────────────

	deriveFalseCeiling(config, results);

	// ── Group 7: Doors ───────────────────────────────────

	deriveDoors(config, results);

	// ── Group 8: Windows ─────────────────────────────────

	deriveWindows(config, results);

	// ── Group 9: Sanitary ────────────────────────────────

	deriveSanitary(config, results);

	// ── Group 10: Kitchen ────────────────────────────────

	deriveKitchen(config, results);

	// ── Group 11: Stairs ─────────────────────────────────

	deriveStairs(config, results);

	// ── Group 12: Facade ─────────────────────────────────

	deriveFacade(config, results);

	// ── Group 13: External ───────────────────────────────

	deriveExternal(config, results);

	// ── Group 14: Roof Works ─────────────────────────────

	deriveRoofWorks(config, results);

	// ── Group 15: Decor ──────────────────────────────────

	deriveDecor(results);

	return results;
}

// ══════════════════════════════════════════════════════════════
// Group 1: Insulation
// ══════════════════════════════════════════════════════════════

function deriveInsulation(
	config: SmartBuildingConfig,
	plasterCache: Map<string, PlasterResult>,
	out: DerivedQuantity[],
) {
	const g = group("INSULATION");
	const wastage = 5;

	// 1a. Waterproofing — foundations (basement only)
	const basement = config.floors.find((f) => f.floorType === "BASEMENT");
	if (basement && basement.area > 0) {
		const qty = basement.area;
		out.push({
			categoryKey: "waterproofing_foundations",
			subCategory: "WP_FOUNDATIONS",
			floorId: basement.id,
			floorName: basement.name,
			scope: "per_floor",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_building",
			sourceDescription: `مساحة البدروم: ${qty} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "direct_area",
				details: { area: qty },
				formula: `مساحة البدروم = ${qty} م²`,
			},
		});
	}

	// 1b. Waterproofing — bathrooms per floor
	for (const floor of habitableFloors(config)) {
		const bathrooms = getFloorRoomsByType(floor, "bathroom");
		if (bathrooms.length === 0) continue;
		const qty = round2(
			bathrooms.reduce((s, r) => s + r.length * r.width, 0),
		);
		if (qty <= 0) continue;
		out.push({
			categoryKey: `waterproofing_bathrooms_${floor.id}`,
			subCategory: "WP_BATHROOMS",
			floorId: floor.id,
			floorName: floor.name,
			scope: "per_floor",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_building",
			sourceDescription: `مجموع أرضيات حمامات ${floor.name}: ${bathrooms.length} حمام = ${qty} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "room_by_room",
				details: {
					bathrooms: bathrooms.map((b) => ({
						name: b.name,
						area: round2(b.length * b.width),
					})),
				},
				formula: `مجموع مساحات أرضيات الحمامات (${bathrooms.length} حمام)`,
			},
		});
	}

	// 1c. Waterproofing — roof
	const roofArea = getRoofArea(config);
	if (roofArea > 0) {
		out.push({
			categoryKey: "waterproofing_roof",
			subCategory: "WP_ROOF",
			scope: "roof",
			quantity: roofArea,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(roofArea, wastage),
			dataSource: "auto_building",
			sourceDescription: `مساحة السطح: ${roofArea} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "direct_area",
				details: { area: roofArea },
				formula: `مساحة السطح = ${roofArea} م²`,
			},
		});
	}

	// 2a. Thermal insulation — walls
	const totalHeight = getTotalExternalWallHeight(config);
	if (config.buildingPerimeter > 0 && totalHeight > 0) {
		const qty = round2(config.buildingPerimeter * totalHeight);
		out.push({
			categoryKey: "thermal_walls",
			subCategory: "TI_WALLS",
			scope: "whole_building",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_building",
			sourceDescription: `محيط المبنى (${config.buildingPerimeter} م.ط) × ارتفاع كلي (${round2(totalHeight)} م) = ${qty} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "direct_area",
				details: {
					perimeter: config.buildingPerimeter,
					totalHeight: round2(totalHeight),
				},
				formula: `${config.buildingPerimeter} م.ط × ${round2(totalHeight)} م = ${qty} م²`,
			},
		});
	}

	// 2b. Thermal insulation — roof (= waterproofing roof)
	if (roofArea > 0) {
		out.push({
			categoryKey: "thermal_roof",
			subCategory: "TI_ROOF",
			scope: "roof",
			quantity: roofArea,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(roofArea, wastage),
			dataSource: "auto_linked",
			sourceDescription: `= عزل مائي سطح: ${roofArea} م²`,
			sourceItemKey: "waterproofing_roof",
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "derived",
				details: { linked_to: "waterproofing_roof" },
				formula: `مساوي لمساحة العزل المائي للسطح = ${roofArea} م²`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 2: Plastering
// ══════════════════════════════════════════════════════════════

function derivePlastering(
	config: SmartBuildingConfig,
	plasterCache: Map<string, PlasterResult>,
	out: DerivedQuantity[],
) {
	const g = group("PLASTERING");
	const wastage = 5;

	// 3. Internal plaster — per floor
	for (const floor of habitableFloors(config)) {
		const p = plasterCache.get(floor.id);
		if (!p || p.totalArea <= 0) continue;
		out.push({
			categoryKey: `internal_plaster_${floor.id}`,
			floorId: floor.id,
			floorName: floor.name,
			scope: "per_floor",
			quantity: p.totalArea,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(p.totalArea, wastage),
			dataSource: p.dataSource,
			sourceDescription:
				p.dataSource === "estimated"
					? `تقديري من مساحة ${floor.name} (${floor.area} م²): جدران ${p.wallArea} + سقف ${p.ceilingArea} = ${p.totalArea} م²`
					: `${floor.name}: جدران ${p.wallArea} + سقف ${p.ceilingArea} - فتحات ${p.internalOpeningsArea} - حمامات ${p.bathroomWallArea} = ${p.totalArea} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: p.breakdown,
		});
	}

	// 4. External plaster — whole building
	const totalHeight = getTotalExternalWallHeight(config);
	if (config.buildingPerimeter > 0 && totalHeight > 0) {
		const grossArea = round2(config.buildingPerimeter * totalHeight);
		const extOpeningsArea = round2(
			config.floors.reduce((sum, floor) => {
				const extOpenings = getFloorOpenings(floor, { isExternal: true });
				const floorMultiplier = floor.isRepeated ? floor.repeatCount : 1;
				return sum + sumOpeningsArea(extOpenings) * floorMultiplier;
			}, 0),
		);
		const qty = round2(Math.max(0, grossArea - extOpeningsArea));

		out.push({
			categoryKey: "external_plaster",
			scope: "external",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: extOpeningsArea > 0 ? "auto_building" : "auto_building",
			sourceDescription: `واجهات: ${config.buildingPerimeter} م.ط × ${round2(totalHeight)} م - فتحات خارجية (${extOpeningsArea} م²) = ${qty} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "wall_deduction",
				details: {
					perimeter: config.buildingPerimeter,
					totalHeight: round2(totalHeight),
					grossArea,
					externalOpeningsArea: extOpeningsArea,
				},
				formula: `(${config.buildingPerimeter} × ${round2(totalHeight)}) - ${extOpeningsArea} = ${qty} م²`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 3: Painting
// ══════════════════════════════════════════════════════════════

function derivePainting(
	config: SmartBuildingConfig,
	plasterCache: Map<string, PlasterResult>,
	out: DerivedQuantity[],
) {
	const g = group("PAINTING");

	// 5. Interior paint — per floor (= internal plaster - bathroom walls)
	for (const floor of habitableFloors(config)) {
		const p = plasterCache.get(floor.id);
		if (!p || p.totalArea <= 0) continue;
		// Paint = plaster total (already has bathroom walls deducted from walls,
		// but includes ceiling). The spec says paint = plaster - bathroom walls.
		// Since plaster total = (walls - openings - bathroom_walls) + ceiling,
		// paint is the same as plaster total.
		const qty = p.totalArea;
		const wastage = 10;

		out.push({
			categoryKey: `interior_paint_${floor.id}`,
			floorId: floor.id,
			floorName: floor.name,
			scope: "per_floor",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_linked",
			sourceDescription: `= لياسة داخلية ${floor.name} (${qty} م²) — بدون جدران الحمامات`,
			sourceItemKey: `internal_plaster_${floor.id}`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "derived",
				details: {
					linked_to: `internal_plaster_${floor.id}`,
					bathroom_wall_area: p.bathroomWallArea,
				},
				formula: `لياسة داخلية ${floor.name} (${qty} م²) = دهان داخلي`,
			},
		});
	}

	// 6. Facade paint — external (= external plaster)
	const extPlaster = out.find((d) => d.categoryKey === "external_plaster");
	if (extPlaster) {
		const wastage = 10;
		out.push({
			categoryKey: "facade_paint",
			scope: "external",
			quantity: extPlaster.quantity,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(extPlaster.quantity, wastage),
			dataSource: "auto_linked",
			sourceDescription: `= لياسة خارجية: ${extPlaster.quantity} م²`,
			sourceItemKey: "external_plaster",
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "derived",
				details: { linked_to: "external_plaster" },
				formula: `مساوي للياسة الخارجية = ${extPlaster.quantity} م²`,
			},
		});
	}

	// 7. Boundary wall paint
	if (config.landPerimeter && config.fenceHeight) {
		const qty = round2(config.landPerimeter * config.fenceHeight * 2);
		const wastage = 8;
		out.push({
			categoryKey: "boundary_paint",
			scope: "external",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_building",
			sourceDescription: `محيط الأرض (${config.landPerimeter} م.ط) × ارتفاع السور (${config.fenceHeight} م) × 2 وجهين = ${qty} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "direct_area",
				details: {
					landPerimeter: config.landPerimeter,
					fenceHeight: config.fenceHeight,
					sides: 2,
				},
				formula: `${config.landPerimeter} × ${config.fenceHeight} × 2 = ${qty} م²`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 4: Flooring
// ══════════════════════════════════════════════════════════════

function deriveFlooring(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("FLOORING");
	const wastage = 10;

	for (const floor of habitableFloors(config)) {
		const hasRooms = (floor.rooms ?? []).length > 0;
		let qty: number;
		let dataSource: DataSourceType;
		let desc: string;
		let breakdown: CalculationBreakdown;

		if (hasRooms) {
			qty = round2(
				floor.rooms!.reduce((s, r) => s + r.length * r.width, 0),
			);
			dataSource = "auto_building";
			desc = `مجموع مساحات غرف ${floor.name}: ${qty} م²`;
			breakdown = {
				type: "room_by_room",
				details: {
					rooms: floor.rooms!.map((r) => ({
						name: r.name,
						area: round2(r.length * r.width),
					})),
				},
				formula: `مجموع مساحات الغرف (${floor.rooms!.length} غرفة) = ${qty} م²`,
			};
		} else {
			qty = floor.area;
			dataSource = "estimated";
			desc = `تقديري: مساحة ${floor.name} = ${qty} م²`;
			breakdown = {
				type: "direct_area",
				details: { area: qty },
				formula: `مساحة الدور = ${qty} م²`,
			};
		}

		if (qty <= 0) continue;

		out.push({
			categoryKey: `flooring_${floor.id}`,
			floorId: floor.id,
			floorName: floor.name,
			scope: "per_floor",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource,
			sourceDescription: desc,
			isEnabled: true,
			...g,
			calculationBreakdown: breakdown,
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 5: Wall Cladding
// ══════════════════════════════════════════════════════════════

function deriveWallCladding(
	config: SmartBuildingConfig,
	plasterCache: Map<string, PlasterResult>,
	out: DerivedQuantity[],
) {
	const g = group("WALL_CLADDING");
	const wastage = 12;

	for (const floor of habitableFloors(config)) {
		// 9a. Bathroom wall tiles
		const p = plasterCache.get(floor.id);
		if (p && p.bathroomWallArea > 0) {
			out.push({
				categoryKey: `wall_tiles_bathroom_${floor.id}`,
				subCategory: "WT_FULL",
				floorId: floor.id,
				floorName: floor.name,
				scope: "per_floor",
				quantity: p.bathroomWallArea,
				unit: "m2",
				wastagePercent: wastage,
				effectiveQuantity: makeEffective(p.bathroomWallArea, wastage),
				dataSource: "auto_linked",
				sourceDescription: `جدران حمامات ${floor.name} (مستثناة من اللياسة): ${p.bathroomWallArea} م²`,
				sourceItemKey: `internal_plaster_${floor.id}`,
				isEnabled: true,
				...g,
				calculationBreakdown: {
					type: "derived",
					details: {
						linked_to: `internal_plaster_${floor.id}`,
						bathroom_wall_area: p.bathroomWallArea,
					},
					formula: `جدران الحمامات المستثناة من اللياسة الداخلية = ${p.bathroomWallArea} م²`,
				},
			});
		}

		// 9b. Kitchen splash back
		const kitchens = getFloorRoomsByType(floor, "kitchen");
		const laundries = getFloorRoomsByType(floor, "laundry");
		const splashRooms = [...kitchens, ...laundries];
		if (splashRooms.length > 0) {
			const qty = round2(
				splashRooms.reduce(
					(s, r) => s + (r.length + r.width) * 2 * DEFAULT_SPLASH_BACK_HEIGHT,
					0,
				),
			);
			if (qty > 0) {
				out.push({
					categoryKey: `wall_tiles_kitchen_${floor.id}`,
					subCategory: "WT_SPLASH",
					floorId: floor.id,
					floorName: floor.name,
					scope: "per_floor",
					quantity: qty,
					unit: "m2",
					wastagePercent: wastage,
					effectiveQuantity: makeEffective(qty, wastage),
					dataSource: "auto_building",
					sourceDescription: `سبلاش باك مطابخ/مغاسل ${floor.name}: محيط × ${DEFAULT_SPLASH_BACK_HEIGHT}م = ${qty} م²`,
					isEnabled: true,
					...g,
					calculationBreakdown: {
						type: "room_by_room",
						details: {
							rooms: splashRooms.map((r) => ({
								name: r.name,
								perimeter: round2((r.length + r.width) * 2),
								splashArea: round2(
									(r.length + r.width) * 2 * DEFAULT_SPLASH_BACK_HEIGHT,
								),
							})),
						},
						formula: `مجموع محيطات المطابخ/المغاسل × ${DEFAULT_SPLASH_BACK_HEIGHT}م = ${qty} م²`,
					},
				});
			}
		}
	}
}

// ══════════════════════════════════════════════════════════════
// Group 6: False Ceiling
// ══════════════════════════════════════════════════════════════

function deriveFalseCeiling(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("FALSE_CEILING");
	const wastage = 10;

	for (const floor of habitableFloors(config)) {
		const hasRooms = (floor.rooms ?? []).length > 0;
		let qty: number;
		let dataSource: DataSourceType;
		let desc: string;
		let breakdown: CalculationBreakdown;

		if (hasRooms) {
			const eligible = floor.rooms!.filter(
				(r) => r.hasFalseCeiling !== false,
			);
			qty = round2(eligible.reduce((s, r) => s + r.length * r.width, 0));
			dataSource = "auto_building";
			desc = `أسقف مستعارة ${floor.name}: ${eligible.length} غرفة = ${qty} م²`;
			breakdown = {
				type: "room_by_room",
				details: {
					rooms: eligible.map((r) => ({
						name: r.name,
						area: round2(r.length * r.width),
					})),
				},
				formula: `مجموع مساحات الغرف ذات السقف المستعار (${eligible.length} غرفة) = ${qty} م²`,
			};
		} else {
			qty = floor.area;
			dataSource = "estimated";
			desc = `تقديري: مساحة ${floor.name} = ${qty} م²`;
			breakdown = {
				type: "direct_area",
				details: { area: qty },
				formula: `مساحة الدور = ${qty} م²`,
			};
		}

		if (qty <= 0) continue;

		out.push({
			categoryKey: `false_ceiling_${floor.id}`,
			floorId: floor.id,
			floorName: floor.name,
			scope: "per_floor",
			quantity: qty,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource,
			sourceDescription: desc,
			isEnabled: true,
			...g,
			calculationBreakdown: breakdown,
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 7: Doors
// ══════════════════════════════════════════════════════════════

function deriveDoors(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("DOORS");

	// Check if any floor has openings
	const hasAnyOpenings = config.floors.some(
		(f) => (f.openings ?? []).length > 0,
	);
	if (!hasAnyOpenings) return;

	// 11. Interior doors
	const intDoorCount = config.floors.reduce((sum, floor) => {
		const doors = getFloorOpenings(floor, {
			type: "door",
			isExternal: false,
		});
		const multiplier = floor.isRepeated ? floor.repeatCount : 1;
		return sum + sumOpeningsCount(doors) * multiplier;
	}, 0);

	if (intDoorCount > 0) {
		out.push({
			categoryKey: "interior_doors",
			scope: "whole_building",
			quantity: intDoorCount,
			unit: "piece",
			wastagePercent: 0,
			effectiveQuantity: intDoorCount,
			dataSource: "auto_building",
			sourceDescription: `مجموع الأبواب الداخلية: ${intDoorCount} باب`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "per_unit",
				details: { count: intDoorCount },
				formula: `مجموع الأبواب الداخلية من كل الأدوار = ${intDoorCount}`,
			},
		});
	}

	// 12. Exterior doors
	const extDoorCount = config.floors.reduce((sum, floor) => {
		const doors = getFloorOpenings(floor, {
			type: "door",
			isExternal: true,
		});
		const multiplier = floor.isRepeated ? floor.repeatCount : 1;
		return sum + sumOpeningsCount(doors) * multiplier;
	}, 0);

	if (extDoorCount > 0) {
		out.push({
			categoryKey: "exterior_doors",
			scope: "whole_building",
			quantity: extDoorCount,
			unit: "piece",
			wastagePercent: 0,
			effectiveQuantity: extDoorCount,
			dataSource: "auto_building",
			sourceDescription: `مجموع الأبواب الخارجية: ${extDoorCount} باب`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "per_unit",
				details: { count: extDoorCount },
				formula: `مجموع الأبواب الخارجية من كل الأدوار = ${extDoorCount}`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 8: Windows
// ══════════════════════════════════════════════════════════════

function deriveWindows(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("WINDOWS");

	const hasAnyOpenings = config.floors.some(
		(f) => (f.openings ?? []).length > 0,
	);
	if (!hasAnyOpenings) return;

	const totalWindowArea = round2(
		config.floors.reduce((sum, floor) => {
			const windows = getFloorOpenings(floor, { type: "window" });
			const multiplier = floor.isRepeated ? floor.repeatCount : 1;
			return sum + sumOpeningsArea(windows) * multiplier;
		}, 0),
	);

	if (totalWindowArea > 0) {
		out.push({
			categoryKey: "windows",
			scope: "whole_building",
			quantity: totalWindowArea,
			unit: "m2",
			wastagePercent: 0,
			effectiveQuantity: totalWindowArea,
			dataSource: "auto_building",
			sourceDescription: `مجموع مساحات النوافذ: ${totalWindowArea} م²`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "per_unit",
				details: { totalArea: totalWindowArea },
				formula: `مجموع (عرض × ارتفاع × عدد) لكل نافذة = ${totalWindowArea} م²`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 9: Sanitary
// ══════════════════════════════════════════════════════════════

function deriveSanitary(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("SANITARY");

	const hasAnyRooms = config.floors.some(
		(f) => (f.rooms ?? []).length > 0,
	);
	if (!hasAnyRooms) return;

	const bathroomCount = config.floors.reduce((sum, floor) => {
		const bathrooms = getFloorRoomsByType(floor, "bathroom");
		const multiplier = floor.isRepeated ? floor.repeatCount : 1;
		return sum + bathrooms.length * multiplier;
	}, 0);

	if (bathroomCount <= 0) return;

	// 14. Bathroom fixtures
	out.push({
		categoryKey: "bathroom_fixtures",
		scope: "whole_building",
		quantity: bathroomCount,
		unit: "set",
		wastagePercent: 0,
		effectiveQuantity: bathroomCount,
		dataSource: "auto_building",
		sourceDescription: `عدد الحمامات: ${bathroomCount} حمام`,
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "per_unit",
			details: { count: bathroomCount },
			formula: `مجموع الحمامات من كل الأدوار = ${bathroomCount}`,
		},
	});

	// 15. Vanities (= bathroom count)
	out.push({
		categoryKey: "vanities",
		scope: "whole_building",
		quantity: bathroomCount,
		unit: "piece",
		wastagePercent: 0,
		effectiveQuantity: bathroomCount,
		dataSource: "auto_linked",
		sourceDescription: `= عدد الحمامات: ${bathroomCount}`,
		sourceItemKey: "bathroom_fixtures",
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "derived",
			details: { linked_to: "bathroom_fixtures" },
			formula: `مغسلة واحدة لكل حمام = ${bathroomCount}`,
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Group 10: Kitchen
// ══════════════════════════════════════════════════════════════

function deriveKitchen(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("KITCHEN");

	const hasAnyRooms = config.floors.some(
		(f) => (f.rooms ?? []).length > 0,
	);
	if (!hasAnyRooms) return;

	const allKitchens: Array<{ name: string; perimeter: number }> = [];
	for (const floor of config.floors) {
		const kitchens = getFloorRoomsByType(floor, "kitchen");
		const multiplier = floor.isRepeated ? floor.repeatCount : 1;
		for (const k of kitchens) {
			const perimeter = (k.length + k.width) * 2;
			for (let i = 0; i < multiplier; i++) {
				allKitchens.push({ name: k.name, perimeter });
			}
		}
	}

	if (allKitchens.length === 0) return;

	// 16. Kitchen cabinets — half perimeter
	const totalLinear = round2(
		allKitchens.reduce((s, k) => s + k.perimeter / 2, 0),
	);

	out.push({
		categoryKey: "kitchen_cabinets",
		scope: "whole_building",
		quantity: totalLinear,
		unit: "m",
		wastagePercent: 0,
		effectiveQuantity: totalLinear,
		dataSource: "auto_building",
		sourceDescription: `خزائن مطابخ: نصف محيط ${allKitchens.length} مطبخ = ${totalLinear} م.ط`,
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "linear",
			details: {
				kitchens: allKitchens.map((k) => ({
					name: k.name,
					halfPerimeter: round2(k.perimeter / 2),
				})),
			},
			formula: `مجموع (محيط المطبخ ÷ 2) = ${totalLinear} م.ط`,
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Group 11: Stairs
// ══════════════════════════════════════════════════════════════

function deriveStairs(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("STAIRS");
	const wastage = 5;

	const stairCount = upperFloorCount(config);

	// 17. Internal stairs — only if more than 1 floor level
	if (stairCount > 0) {
		out.push({
			categoryKey: "internal_stairs",
			scope: "whole_building",
			quantity: stairCount,
			unit: "piece",
			wastagePercent: wastage,
			effectiveQuantity: stairCount, // count doesn't get wastage
			dataSource: "auto_building",
			sourceDescription: `عدد الأدراج الداخلية: ${stairCount} درج`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "per_unit",
				details: { upperFloors: stairCount },
				formula: `عدد الأدوار فوق الأرضي = ${stairCount} درج`,
			},
		});
	}

	// 18. External stairs — default 1
	out.push({
		categoryKey: "external_stairs",
		scope: "external",
		quantity: 1,
		unit: "piece",
		wastagePercent: wastage,
		effectiveQuantity: 1,
		dataSource: "auto_building",
		sourceDescription: "درج مدخل خارجي: 1 (افتراضي)",
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "per_unit",
			details: { count: 1 },
			formula: "درج مدخل واحد = 1",
		},
	});

	// 19. Railings — stairs × 4 m.ط
	if (stairCount > 0) {
		const qty = stairCount * 4;
		out.push({
			categoryKey: "railings",
			scope: "whole_building",
			quantity: qty,
			unit: "m",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(qty, wastage),
			dataSource: "auto_derived",
			sourceDescription: `درابزين: ${stairCount} درج × 4 م.ط = ${qty} م.ط`,
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "linear",
				details: { stairCount, metersPerStair: 4 },
				formula: `${stairCount} × 4 = ${qty} م.ط`,
			},
		});
	}
}

// ══════════════════════════════════════════════════════════════
// Group 12: Facade
// ══════════════════════════════════════════════════════════════

function deriveFacade(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("FACADE");

	// 20. Stone facade cladding (= external plaster)
	const extPlaster = out.find((d) => d.categoryKey === "external_plaster");
	if (extPlaster) {
		const wastage = 10;
		out.push({
			categoryKey: "stone_facade",
			scope: "external",
			quantity: extPlaster.quantity,
			unit: "m2",
			wastagePercent: wastage,
			effectiveQuantity: makeEffective(extPlaster.quantity, wastage),
			dataSource: "auto_linked",
			sourceDescription: `= لياسة خارجية: ${extPlaster.quantity} م²`,
			sourceItemKey: "external_plaster",
			isEnabled: true,
			...g,
			calculationBreakdown: {
				type: "derived",
				details: { linked_to: "external_plaster" },
				formula: `مساوي للياسة الخارجية = ${extPlaster.quantity} م²`,
			},
		});
	}

	// 21. Facade decorations — lump sum, disabled
	out.push({
		categoryKey: "facade_decor",
		scope: "external",
		quantity: 0,
		unit: "lump_sum",
		wastagePercent: 0,
		effectiveQuantity: 0,
		dataSource: "manual",
		sourceDescription: "مقطوعية — يُحدد من المستخدم",
		isEnabled: false,
		...g,
		calculationBreakdown: {
			type: "lump_sum",
			details: {},
			formula: "مقطوعية حسب التصميم",
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Group 13: External Works
// ══════════════════════════════════════════════════════════════

function deriveExternal(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("EXTERNAL");

	// 22. Yard paving
	if (config.hasCourtyard !== false) {
		const groundFloor = config.floors.find(
			(f) => f.floorType === "GROUND",
		);
		const largestFloorArea = Math.max(
			...config.floors
				.filter((f) => f.floorType !== "ROOF")
				.map((f) => f.area),
			0,
		);
		const buildingFootprint = Math.max(
			groundFloor?.area ?? 0,
			largestFloorArea,
		);
		const yardArea = round2(
			Math.max(0, config.totalLandArea - buildingFootprint),
		);

		if (yardArea > 0) {
			const wastage = 8;
			out.push({
				categoryKey: "yard_paving",
				scope: "external",
				quantity: yardArea,
				unit: "m2",
				wastagePercent: wastage,
				effectiveQuantity: makeEffective(yardArea, wastage),
				dataSource: "auto_building",
				sourceDescription: `أرض (${config.totalLandArea} م²) - مبنى (${buildingFootprint} م²) = ${yardArea} م²`,
				isEnabled: true,
				...g,
				calculationBreakdown: {
					type: "direct_area",
					details: {
						totalLandArea: config.totalLandArea,
						buildingFootprint,
					},
					formula: `${config.totalLandArea} - ${buildingFootprint} = ${yardArea} م²`,
				},
			});

			// 24. Landscaping
			if (
				config.hasGarden &&
				config.gardenPercentage &&
				config.gardenPercentage > 0
			) {
				const gardenArea = round2(
					yardArea * (config.gardenPercentage / 100),
				);
				if (gardenArea > 0) {
					out.push({
						categoryKey: "landscaping",
						scope: "external",
						quantity: gardenArea,
						unit: "m2",
						wastagePercent: 0,
						effectiveQuantity: gardenArea,
						dataSource: "auto_derived",
						sourceDescription: `حديقة: ${yardArea} م² × ${config.gardenPercentage}% = ${gardenArea} م²`,
						sourceItemKey: "yard_paving",
						isEnabled: true,
						...g,
						calculationBreakdown: {
							type: "derived",
							details: {
								yardArea,
								gardenPercentage: config.gardenPercentage,
							},
							formula: `${yardArea} × ${config.gardenPercentage}% = ${gardenArea} م²`,
						},
					});
				}
			}
		}
	}

	// 23. Fence gates — default 1
	out.push({
		categoryKey: "fence_gates",
		scope: "external",
		quantity: 1,
		unit: "piece",
		wastagePercent: 0,
		effectiveQuantity: 1,
		dataSource: "auto_building",
		sourceDescription: "بوابة سور: 1 (افتراضي)",
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "per_unit",
			details: { count: 1 },
			formula: "بوابة واحدة افتراضية = 1",
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Group 14: Roof Works
// ══════════════════════════════════════════════════════════════

function deriveRoofWorks(
	config: SmartBuildingConfig,
	out: DerivedQuantity[],
) {
	const g = group("ROOF_WORKS");
	const roofArea = getRoofArea(config);
	if (roofArea <= 0) return;

	const wastage = 5;
	out.push({
		categoryKey: "roof_finishing",
		scope: "roof",
		quantity: roofArea,
		unit: "m2",
		wastagePercent: wastage,
		effectiveQuantity: makeEffective(roofArea, wastage),
		dataSource: "auto_linked",
		sourceDescription: `= مساحة السطح: ${roofArea} م²`,
		sourceItemKey: "waterproofing_roof",
		isEnabled: true,
		...g,
		calculationBreakdown: {
			type: "derived",
			details: { linked_to: "waterproofing_roof" },
			formula: `مساحة السطح = ${roofArea} م²`,
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Group 15: Decor
// ══════════════════════════════════════════════════════════════

function deriveDecor(out: DerivedQuantity[]) {
	const g = group("DECOR");

	out.push({
		categoryKey: "interior_decor",
		scope: "whole_building",
		quantity: 0,
		unit: "lump_sum",
		wastagePercent: 0,
		effectiveQuantity: 0,
		dataSource: "manual",
		sourceDescription: "مقطوعية — يُحدد من المستخدم",
		isEnabled: false,
		...g,
		calculationBreakdown: {
			type: "lump_sum",
			details: {},
			formula: "مقطوعية حسب التصميم",
		},
	});
}

// ══════════════════════════════════════════════════════════════
// Reverse Derivation — from existing manual items
// ══════════════════════════════════════════════════════════════

interface ExistingItem {
	id: string;
	category: string;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
	unit?: string;
	dataSource?: string | null;
	calculationData?: Record<string, unknown> | null;
}

export function deriveFromExistingItems(
	existingItems: ExistingItem[],
	partialConfig: Partial<SmartBuildingConfig>,
): DerivedQuantity[] {
	const results: DerivedQuantity[] = [];

	for (const item of existingItems) {
		if (item.dataSource && item.dataSource !== "manual") continue;
		const qty = item.area ?? item.quantity ?? item.length ?? 0;
		if (qty <= 0) continue;

		const cat = item.category;

		// Internal plaster → can derive paint + flooring + false ceiling
		if (cat === "FINISHING_INTERNAL_PLASTER" && item.floorId) {
			results.push({
				categoryKey: `interior_paint_${item.floorId}`,
				floorId: item.floorId,
				floorName: item.floorName ?? undefined,
				scope: "per_floor",
				quantity: qty,
				unit: "m2",
				wastagePercent: 10,
				effectiveQuantity: makeEffective(qty, 10),
				dataSource: "auto_linked",
				sourceDescription: `= لياسة داخلية يدوية: ${qty} م²`,
				sourceItemKey: item.id,
				isEnabled: true,
				...group("PAINTING"),
				calculationBreakdown: {
					type: "derived",
					details: { source_item_id: item.id },
					formula: `من بند لياسة داخلية يدوي = ${qty} م²`,
				},
			});
		}

		// Interior paint → can estimate plaster (paint + tiled walls)
		if (cat === "FINISHING_INTERIOR_PAINT" && item.floorId) {
			results.push({
				categoryKey: `false_ceiling_${item.floorId}`,
				floorId: item.floorId,
				floorName: item.floorName ?? undefined,
				scope: "per_floor",
				quantity: qty,
				unit: "m2",
				wastagePercent: 10,
				effectiveQuantity: makeEffective(qty, 10),
				dataSource: "auto_linked",
				sourceDescription: `تقدير من دهان داخلي يدوي: ${qty} م²`,
				sourceItemKey: item.id,
				isEnabled: true,
				...group("FALSE_CEILING"),
				calculationBreakdown: {
					type: "derived",
					details: { source_item_id: item.id },
					formula: `تقدير من دهان داخلي = ${qty} م²`,
				},
			});
		}

		// Flooring → can estimate false ceiling
		if (cat === "FINISHING_FLOOR_TILES" && item.floorId) {
			results.push({
				categoryKey: `false_ceiling_${item.floorId}`,
				floorId: item.floorId,
				floorName: item.floorName ?? undefined,
				scope: "per_floor",
				quantity: qty,
				unit: "m2",
				wastagePercent: 10,
				effectiveQuantity: makeEffective(qty, 10),
				dataSource: "auto_linked",
				sourceDescription: `= أرضيات يدوية: ${qty} م²`,
				sourceItemKey: item.id,
				isEnabled: true,
				...group("FALSE_CEILING"),
				calculationBreakdown: {
					type: "derived",
					details: { source_item_id: item.id },
					formula: `مساوي لمساحة الأرضيات = ${qty} م²`,
				},
			});
		}
	}

	return results;
}

// ══════════════════════════════════════════════════════════════
// Cascade Effects
// ══════════════════════════════════════════════════════════════

// Map of source → dependents
const CASCADE_MAP: Record<string, string[]> = {
	waterproofing_roof: ["thermal_roof", "roof_finishing"],
	external_plaster: ["facade_paint", "stone_facade"],
	bathroom_fixtures: ["vanities"],
};

export function calculateCascadeEffects(
	changedItemKey: string,
	newQuantity: number,
	allItems: DerivedQuantity[],
): { itemKey: string; oldQuantity: number; newQuantity: number }[] {
	const effects: {
		itemKey: string;
		oldQuantity: number;
		newQuantity: number;
	}[] = [];

	// Check direct cascade map
	const directDeps = CASCADE_MAP[changedItemKey] ?? [];
	for (const depKey of directDeps) {
		const item = allItems.find((d) => d.categoryKey === depKey);
		if (item) {
			effects.push({
				itemKey: depKey,
				oldQuantity: item.quantity,
				newQuantity,
			});
		}
	}

	// Check internal_plaster_* → interior_paint_*, wall_tiles_bathroom_*
	if (changedItemKey.startsWith("internal_plaster_")) {
		const floorId = changedItemKey.replace("internal_plaster_", "");
		const paintKey = `interior_paint_${floorId}`;
		const paintItem = allItems.find((d) => d.categoryKey === paintKey);
		if (paintItem) {
			effects.push({
				itemKey: paintKey,
				oldQuantity: paintItem.quantity,
				newQuantity,
			});
		}
	}

	// Check yard_paving → landscaping
	if (changedItemKey === "yard_paving") {
		const landscaping = allItems.find(
			(d) => d.categoryKey === "landscaping",
		);
		if (landscaping && landscaping.calculationBreakdown?.details) {
			const pct =
				(landscaping.calculationBreakdown.details as Record<string, number>)
					.gardenPercentage ?? 0;
			const newGardenQty = round2(newQuantity * (pct / 100));
			effects.push({
				itemKey: "landscaping",
				oldQuantity: landscaping.quantity,
				newQuantity: newGardenQty,
			});
		}
	}

	return effects;
}
