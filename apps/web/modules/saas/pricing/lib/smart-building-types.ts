// === إعدادات المبنى الموسّعة ===

export interface SmartBuildingConfig {
	// البيانات الأساسية (موجودة حالياً)
	totalLandArea: number;
	buildingPerimeter: number;
	floors: SmartFloorConfig[];

	// بيانات جديدة — السور والحوش
	landPerimeter?: number;
	fenceHeight?: number;
	hasCourtyard?: boolean;
	hasGarden?: boolean;
	gardenPercentage?: number;

	// حالة الإعداد
	setupStep?: number;
	isComplete?: boolean;
}

export interface SmartFloorConfig {
	// الحقول الحالية
	id: string;
	name: string;
	area: number;
	height: number;
	sortOrder: number;
	isRepeated: boolean;
	repeatCount: number;
	floorType: FloorType;

	// حقول جديدة — الغرف
	rooms?: RoomConfig[];

	// حقول جديدة — الفتحات
	openings?: OpeningConfig[];
}

export type FloorType =
	| "BASEMENT"
	| "GROUND"
	| "UPPER"
	| "ANNEX"
	| "ROOF"
	| "MEZZANINE";

export interface RoomConfig {
	id: string;
	name: string;
	length: number;
	width: number;
	type: RoomType;
	hasFalseCeiling?: boolean;
}

export type RoomType =
	| "bedroom"
	| "living"
	| "majlis"
	| "kitchen"
	| "bathroom"
	| "hall"
	| "corridor"
	| "storage"
	| "laundry"
	| "maid_room"
	| "other";

export const TILED_WALL_ROOMS: RoomType[] = ["bathroom"];

export const SPLASH_BACK_ROOMS: RoomType[] = ["kitchen", "laundry"];

export const DEFAULT_SPLASH_BACK_HEIGHT = 0.6;

export interface OpeningConfig {
	id: string;
	type: "door" | "window";
	subType: string;
	width: number;
	height: number;
	count: number;
	isExternal: boolean;
	roomId?: string;
}

export const DEFAULT_OPENINGS: Record<
	string,
	{ width: number; height: number; isExternal: boolean }
> = {
	"باب عادي": { width: 0.9, height: 2.1, isExternal: false },
	"باب حمام": { width: 0.7, height: 2.1, isExternal: false },
	"باب رئيسي": { width: 1.2, height: 2.4, isExternal: true },
	"باب مطبخ": { width: 0.9, height: 2.1, isExternal: false },
	"نافذة كبيرة": { width: 1.5, height: 1.5, isExternal: true },
	"نافذة متوسطة": { width: 1.2, height: 1.2, isExternal: true },
	"نافذة صغيرة": { width: 0.6, height: 0.6, isExternal: true },
};

// === مصدر البيانات ===

export type DataSourceType =
	| "auto_building"
	| "auto_linked"
	| "auto_derived"
	| "manual"
	| "estimated";

// === الكمية المحسوبة ===

export interface DerivedQuantity {
	categoryKey: string;
	subCategory?: string;
	floorId?: string;
	floorName?: string;
	scope: "per_floor" | "whole_building" | "external" | "roof";
	quantity: number;
	unit: string;
	wastagePercent: number;
	effectiveQuantity: number;
	dataSource: DataSourceType;
	sourceDescription: string;
	sourceItemKey?: string;
	calculationBreakdown?: CalculationBreakdown;
	isEnabled: boolean;
	groupKey: string;
	groupName: string;
	groupIcon: string;
	groupColor: string;
}

export interface CalculationBreakdown {
	type:
		| "direct_area"
		| "wall_deduction"
		| "room_by_room"
		| "per_unit"
		| "linear"
		| "lump_sum"
		| "derived";
	details: Record<string, unknown>;
	formula: string;
}
