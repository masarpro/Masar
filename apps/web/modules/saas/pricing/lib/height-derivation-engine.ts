// ═══════════════════════════════════════════════════════════════
// Height Derivation Engine
// Pure function module — no React dependencies
// ═══════════════════════════════════════════════════════════════

import type {
	StructuralBuildingConfig,
	BuildingHeightProperties,
	DerivedFloorHeights,
} from "../types/structural-building-config";

// ─── Saudi defaults ───

export const SAUDI_DEFAULTS: BuildingHeightProperties = {
	heightInputMode: "manual",
	includeFinishInLevels: true,
	finishThickness: 10,              // cm
	streetLevel: 0,                   // m
	excavationDepth: 2.0,             // m
	plainConcreteThickness: 10,       // cm
	foundationDepth: 60,              // cm
	beamDepth: 60,                    // cm (tie beam)
	buildingElevationAboveStreet: 60, // cm
	defaultSlabThickness: 20,         // cm
	defaultBeamDepth: 60,             // cm
	hasParapet: true,
	parapetHeight: 100,               // cm
	invertedBeamDepth: 40,            // cm
	roofWaterproofingThickness: 15,   // cm
};

// ─── Result types ───

export interface DerivedBuildingHeights {
	neckHeight: number | null;         // cm
	floors: Record<string, DerivedFloorHeights>;
	parapet: {
		blockHeight: number;           // cm
		totalHeight: number;           // cm
		isAutoCalculated: boolean;
	} | null;
	summary: {
		totalBuildingHeight: number;   // m
		excavationToRoof: number;      // m
	};
}

// ─── Actual slab data (optional, from structural items) ───

export interface FloorSlabData {
	floorId: string;
	slabThickness: number;  // cm
	beamDepth: number;      // cm
}

// ─── Main derivation function ───

export function deriveHeights(
	config: StructuralBuildingConfig,
	slabData?: FloorSlabData[],
): DerivedBuildingHeights | null {
	const hp = config.heightProperties;
	if (!hp) return null;

	// Index actual slab data by floorId for quick lookup
	const slabDataByFloor = new Map<string, FloorSlabData>();
	if (slabData) {
		for (const sd of slabData) {
			slabDataByFloor.set(sd.floorId, sd);
		}
	}

	const enabledFloors = config.floors
		.filter((f) => f.enabled)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	const floors: Record<string, DerivedFloorHeights> = {};
	let totalAboveGround = 0;

	// Derive floor-to-floor heights
	for (let i = 0; i < enabledFloors.length; i++) {
		const floor = enabledFloors[i];
		let floorToFloor: number | null = null;

		if (hp.heightInputMode === "levels") {
			// Levels mode: finishLevel[next] - finishLevel[current]
			const nextFloor = enabledFloors[i + 1];
			if (
				floor.finishLevel != null &&
				nextFloor?.finishLevel != null
			) {
				floorToFloor = nextFloor.finishLevel - floor.finishLevel;
			}
		} else {
			// Manual mode: use floor.height directly
			floorToFloor = floor.height > 0 ? floor.height : null;
		}

		// Column height = floorToFloor(m)*100 - slabThickness - max(0, beamDepth - slabThickness)
		let columnHeight: number | null = null;
		let blockHeight: number | null = null;

		if (floorToFloor != null && floorToFloor > 0) {
			// Use actual slab data if available, otherwise fall back to defaults
			const actualSlab = slabDataByFloor.get(floor.id);
			const slabThickness = actualSlab?.slabThickness ?? hp.defaultSlabThickness;
			const beamDepth = actualSlab?.beamDepth ?? hp.defaultBeamDepth;
			const visibleBeam = Math.max(0, beamDepth - slabThickness);

			columnHeight = floorToFloor * 100 - slabThickness - visibleBeam;
			blockHeight = floorToFloor * 100 - visibleBeam;

			totalAboveGround += floorToFloor;
		}

		floors[floor.id] = {
			floorToFloorHeight: floorToFloor,
			columnHeight,
			blockHeight,
			neckHeight: null,
			isAutoCalculated: true,
		};
	}

	// Neck height (ground floor only)
	const neckHeight = deriveNeckHeight(hp);

	// Set neck height on ground floor
	const groundFloor = enabledFloors.find((f) => f.type === "ground");
	if (groundFloor && floors[groundFloor.id]) {
		floors[groundFloor.id].neckHeight = neckHeight;
	}

	// Parapet
	let parapet: DerivedBuildingHeights["parapet"] = null;
	if (hp.hasParapet) {
		const blockHeight = hp.parapetHeight - hp.invertedBeamDepth - hp.roofWaterproofingThickness;
		parapet = {
			blockHeight: Math.max(0, blockHeight),
			totalHeight: hp.parapetHeight,
			isAutoCalculated: true,
		};
	}

	return {
		neckHeight,
		floors,
		parapet,
		summary: {
			totalBuildingHeight: totalAboveGround,
			excavationToRoof: hp.excavationDepth + totalAboveGround,
		},
	};
}

// ─── Neck height derivation ───

function deriveNeckHeight(hp: BuildingHeightProperties): number | null {
	const result =
		hp.excavationDepth * 100 -
		hp.plainConcreteThickness -
		hp.foundationDepth -
		hp.beamDepth +
		hp.buildingElevationAboveStreet;

	return result > 0 ? result : null;
}

// ─── Override merging ───

export function getEffectiveHeights(
	derived: DerivedBuildingHeights,
	overrides?: Record<string, Partial<DerivedFloorHeights>>,
): DerivedBuildingHeights {
	if (!overrides) return derived;

	const mergedFloors: Record<string, DerivedFloorHeights> = {};

	for (const [floorId, derivedFloor] of Object.entries(derived.floors)) {
		const override = overrides[floorId];
		if (override) {
			mergedFloors[floorId] = {
				floorToFloorHeight: override.floorToFloorHeight ?? derivedFloor.floorToFloorHeight,
				columnHeight: override.columnHeight ?? derivedFloor.columnHeight,
				blockHeight: override.blockHeight ?? derivedFloor.blockHeight,
				neckHeight: override.neckHeight ?? derivedFloor.neckHeight,
				isAutoCalculated: false,
			};
		} else {
			mergedFloors[floorId] = derivedFloor;
		}
	}

	return {
		...derived,
		floors: mergedFloors,
	};
}
