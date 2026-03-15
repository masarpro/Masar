// ═══════════════════════════════════════════════════════════════
// Structural Building Config Types
// ═══════════════════════════════════════════════════════════════

export type StructuralFloorType = "basement" | "ground" | "mezzanine" | "upper" | "repeated" | "annex";

export type HeightInputMode = "manual" | "levels";

export interface BuildingHeightProperties {
	heightInputMode: HeightInputMode;
	includeFinishInLevels: boolean;
	finishThickness: number;             // cm
	streetLevel: number;                 // m
	excavationDepth: number;             // m
	plainConcreteThickness: number;      // cm
	foundationDepth: number;             // cm
	beamDepth: number;                   // cm (tie beam)
	buildingElevationAboveStreet: number;// cm
	defaultSlabThickness: number;        // cm
	defaultBeamDepth: number;            // cm (full beam)
	hasParapet: boolean;
	parapetHeight: number;               // cm
	parapetLevel?: number;               // m (finish level, optional)
	invertedBeamDepth: number;           // cm
	roofWaterproofingThickness: number;  // cm
}

export interface DerivedFloorHeights {
	floorToFloorHeight: number | null;   // m
	columnHeight: number | null;         // cm
	blockHeight: number | null;          // cm
	neckHeight: number | null;           // cm (ground floor only)
	isAutoCalculated: boolean;
}

export interface StructuralFloorConfig {
	id: string;
	type: StructuralFloorType;
	label: string;        // Arabic display name
	icon: string;
	height: number;        // meters
	slabArea: number;      // m²
	sortOrder: number;
	isRepeated: boolean;
	repeatCount: number;   // 1 for non-repeated
	enabled: boolean;
	hasNeckColumns?: boolean;
	finishLevel?: number;  // m above datum
	derived?: DerivedFloorHeights;
}

export interface StructuralBuildingConfig {
	floors: StructuralFloorConfig[];
	isComplete: boolean;
	heightProperties?: BuildingHeightProperties;
	heightOverrides?: Record<string, Partial<DerivedFloorHeights>>;
}

// ═══════════════════════════════════════════════════════════════
// Floor Definitions (master list of available floor types)
// ═══════════════════════════════════════════════════════════════

export interface FloorDefinition {
	type: StructuralFloorType;
	label: string;
	icon: string;
	defaultHeight: number;
	hasNeckColumns?: boolean;
	alwaysEnabled?: boolean; // ground floor can't be toggled off
}

export const STRUCTURAL_FLOOR_DEFINITIONS: FloorDefinition[] = [
	{ type: "basement", label: "بدروم", icon: "🏗️", defaultHeight: 3.0 },
	{ type: "ground", label: "أرضي", icon: "🏠", defaultHeight: 3.2, hasNeckColumns: true, alwaysEnabled: true },
	{ type: "mezzanine", label: "ميزانين", icon: "📐", defaultHeight: 2.8 },
	{ type: "upper", label: "دور علوي", icon: "🏢", defaultHeight: 3.0 },
	{ type: "repeated", label: "متكرر", icon: "🔁", defaultHeight: 3.0 },
	{ type: "annex", label: "ملحق", icon: "🏗️", defaultHeight: 3.0 },
];

// Arabic ordinal names for upper floors
const UPPER_FLOOR_ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

export function getUpperFloorLabel(index: number): string {
	return UPPER_FLOOR_ORDINALS[index] || `${index + 1}`;
}

// ═══════════════════════════════════════════════════════════════
// Conversion helpers — produce dropdown data from config
// ═══════════════════════════════════════════════════════════════

/** Returns Arabic string[] for slabs/blocks floor dropdowns */
export function configToFloorLabels(config: StructuralBuildingConfig): string[] {
	return config.floors
		.filter((f) => f.enabled)
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((f) => f.label);
}

/** FloorDef shape expected by ColumnsSection */
export interface FloorDef {
	id: string;
	label: string;
	icon: string;
	hasNeckColumns?: boolean;
	isRepeated?: boolean;
	height?: number;
}

/** Returns FloorDef[] for columns section */
export function configToColumnFloorDefs(config: StructuralBuildingConfig): FloorDef[] {
	return config.floors
		.filter((f) => f.enabled)
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((f) => ({
			id: f.id,
			label: f.label,
			icon: f.icon,
			hasNeckColumns: f.hasNeckColumns,
			isRepeated: f.isRepeated,
			height: f.height,
		}));
}

// ═══════════════════════════════════════════════════════════════
// Default config factory
// ═══════════════════════════════════════════════════════════════

export function createDefaultConfig(): StructuralBuildingConfig {
	return {
		floors: [
			{
				id: "ground",
				type: "ground",
				label: "أرضي",
				icon: "🏠",
				height: 3.2,
				slabArea: 0,
				sortOrder: 1,
				isRepeated: false,
				repeatCount: 1,
				enabled: true,
				hasNeckColumns: true,
			},
		],
		isComplete: false,
	};
}
