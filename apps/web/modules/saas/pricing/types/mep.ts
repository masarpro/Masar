// ═══════════════════════════════════════════════════════════
// MEP Types — أنواع الأعمال الكهروميكانيكية
// ═══════════════════════════════════════════════════════════

// Re-export building types used by MEP from existing definitions
export type {
	SmartBuildingConfig,
	SmartFloorConfig,
	RoomConfig,
	RoomType,
	FloorType,
} from "../lib/smart-building-types";

export type MEPCategoryId =
	| "ELECTRICAL"
	| "PLUMBING"
	| "HVAC"
	| "FIREFIGHTING"
	| "LOW_CURRENT"
	| "SPECIAL";

export type ElectricalSubCategory =
	| "lighting"
	| "power_outlets"
	| "cables"
	| "panels"
	| "earthing"
	| "emergency";

export type PlumbingSubCategory =
	| "water_supply"
	| "drainage"
	| "pipes"
	| "tanks"
	| "pumps"
	| "heaters"
	| "manholes"
	| "fixtures";

export type HVACSubCategory =
	| "ac_units"
	| "refrigerant"
	| "ductwork"
	| "diffusers"
	| "ventilation"
	| "condensate";

export type FirefightingSubCategory =
	| "alarm"
	| "sprinklers"
	| "hose_cabinets"
	| "extinguishers"
	| "fire_pumps"
	| "fire_tank";

export type LowCurrentSubCategory =
	| "network"
	| "cctv"
	| "intercom"
	| "sound"
	| "access";

export type SpecialSubCategory =
	| "elevator"
	| "generator"
	| "solar"
	| "gas"
	| "lightning_protection";

export type MEPSubCategory =
	| ElectricalSubCategory
	| PlumbingSubCategory
	| HVACSubCategory
	| FirefightingSubCategory
	| LowCurrentSubCategory
	| SpecialSubCategory;

export interface MEPDerivedItem {
	category: MEPCategoryId;
	subCategory: string;
	itemType: string;
	name: string;
	floorId: string | null;
	floorName: string | null;
	roomId: string | null;
	roomName: string | null;
	scope: "per_room" | "per_floor" | "per_building" | "external";
	groupKey: string;
	quantity: number;
	unit: string;
	materialPrice: number;
	laborPrice: number;
	wastagePercent: number;
	calculationData: Record<string, any>;
	sourceFormula: string;
	specData: Record<string, any>;
	qualityLevel: "economy" | "standard" | "premium";
}

export interface MEPMergedItem extends MEPDerivedItem {
	id?: string;
	isNew: boolean;
	isSaved: boolean;
	isManualOverride: boolean;
	isEnabled: boolean;
	savedQuantity?: number;
	derivedQuantity?: number;
	totalCost: number;
	materialCost: number;
	laborCost: number;
	dataSource: "auto" | "manual" | "estimated";
}

export interface MEPCategoryConfig {
	id: MEPCategoryId;
	nameAr: string;
	nameEn: string;
	icon: string;
	color: string;
	subCategories: Record<
		string,
		{
			nameAr: string;
			nameEn: string;
			defaultUnit: string;
			icon?: string;
		}
	>;
}

export interface RoomMEPProfile {
	spotLightCoverage: number; // م² لكل سبوت
	luxLevel: number;
	hasChandelier: boolean;
	outlets13A: number;
	outlets20A_AC: number;
	outlets20A_heater: number;
	outlets32A_oven: number;
	outlets20A_washer: number;
	needsAC: boolean;
	coolingFactorBTU: number; // BTU/م²
	hasWaterSupply: boolean;
	hasDrainage: boolean;
	needsExhaustFan: boolean;
	plumbingFixtures: {
		washbasin: number;
		wc: number;
		shower: number;
		bathtub: number;
		kitchenSink: number;
		washer: number;
		bidet: number;
	};
	fixtureUnits: number; // FU إجمالي
	drainageFixtureUnits: number; // DFU إجمالي
	networkPoints: number;
}

export interface ExteriorConfig {
	fenceLength?: number;
	fenceHeight?: number;
	gardenArea?: number;
	courtyardArea?: number;
	hasPool?: boolean;
	poolArea?: number;
}
