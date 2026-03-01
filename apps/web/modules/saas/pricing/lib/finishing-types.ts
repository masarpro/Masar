// ══════════════════════════════════════════════════════════════
// Finishing Module Types — BuildingConfig & Floor Configuration
// ══════════════════════════════════════════════════════════════

export type FloorType = "BASEMENT" | "GROUND" | "UPPER" | "ANNEX" | "ROOF" | "MEZZANINE";

export interface FloorConfig {
	id: string;
	name: string;
	area: number;
	height: number;
	sortOrder: number;
	isRepeated: boolean;
	repeatCount: number;
	floorType: FloorType;
}

export interface BuildingConfig {
	totalLandArea: number;
	buildingPerimeter: number;
	floors: FloorConfig[];
}

/** Default floor names by type (Arabic) */
export const DEFAULT_FLOOR_NAMES: Record<FloorType, string> = {
	BASEMENT: "بدروم",
	GROUND: "الدور الأرضي",
	UPPER: "دور علوي",
	ANNEX: "الملحق العلوي",
	ROOF: "السطح",
	MEZZANINE: "ميزانين",
};

/** Default floor heights by type (meters) */
export const DEFAULT_FLOOR_HEIGHTS: Record<FloorType, number> = {
	BASEMENT: 3.0,
	GROUND: 3.2,
	UPPER: 3.2,
	ANNEX: 3.0,
	ROOF: 0,
	MEZZANINE: 2.8,
};

/** Get the computed total building area from a BuildingConfig */
export function getTotalBuildingArea(config: BuildingConfig): number {
	return config.floors.reduce(
		(sum, floor) => sum + floor.area * floor.repeatCount,
		0,
	);
}

/** Calculator result interface returned by calculators */
export interface CalculatorResult {
	area?: number;
	quantity?: number;
	length?: number;
	calculationData?: Record<string, unknown>;
}
