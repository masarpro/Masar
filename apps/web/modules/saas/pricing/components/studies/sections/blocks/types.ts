import type { StructuralFloorConfig, StructuralBuildingConfig } from "../../../../types/structural-building-config";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BlocksSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		quantity: number;
		dimensions: Record<string, number>;
		totalCost: number;
	}>;
	allItems?: Array<{ category: string; dimensions: Record<string, any>; subCategory?: string | null }>;
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
	buildingFloors?: StructuralFloorConfig[];
	buildingConfig?: StructuralBuildingConfig | null;
}

export interface FloorInfo {
	id: string;
	label: string;
	icon: string;
	sortOrder: number;
	isRepeated: boolean;
	repeatCount: number;
}

export interface EnhancedBlockResult {
	grossArea: number;
	openingsArea: number;
	netArea: number;
	blocks: {
		count: number;
		wasteCount: number;
		totalCount: number;
		wastePercentage: number;
		pricePerBlock: number;
		totalCost: number;
	};
	mortar: {
		volume: number;
		cementBags: number;
		sandVolume: number;
		cost: number;
	};
	lintels: {
		count: number;
		totalLength: number;
		concreteVolume: number;
		rebarWeight: number;
		cost: number;
	} | null;
	costs: {
		blocks: number;
		mortar: number;
		lintels: number;
		labor: number;
		total: number;
	};
}

export interface Opening {
	id: string;
	type: "door" | "window";
	width: number;
	height: number;
	quantity: number;
}

export interface BlockFormProps {
	isFloorScoped: boolean;
	floorLabel?: string;
	editingItem?: BlocksSectionProps["items"][0] | null;
	onSave: () => void;
	onCancel: () => void;
	studyId: string;
	organizationId: string;
	items: BlocksSectionProps["items"];
	editingItemId: string | null;
	onSaveCallback: () => void;
	onUpdateCallback: () => void;
	derivedBlockHeight?: number | null;
}

export interface BlockItemsTableProps {
	items: BlocksSectionProps["items"];
	onEdit: (itemId: string, wallCategory: string, floor: string, defaultFloorLabel: string) => void;
	onDelete: (id: string) => void;
	isDeletePending: boolean;
}

export interface CopyFromFloorButtonProps {
	currentFloor: string;
	floors: FloorInfo[];
	getFloorItems: (label: string, isFirst: boolean) => BlocksSectionProps["items"];
	studyId: string;
	organizationId: string;
	onSave: () => void;
}

export interface BlocksSummaryProps {
	items: BlocksSectionProps["items"];
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_FLOOR_NAMES = ["أرضي", "أول", "ثاني", "ثالث", "رابع", "متكرر", "أخير"] as const;

export const CLASSIFICATIONS_NEEDING_FLOOR = ['external', 'internal', 'partition'];

export const BLOCK_PRICES: Record<number, number> = {
	10: 2.5,
	15: 3.0,
	20: 3.5,
	25: 4.0,
	30: 4.5,
};

export const MORTAR_PRICE = 150; // ريال/م³
export const LINTEL_CONCRETE_PRICE = 350; // ريال/م³
export const LINTEL_REBAR_PRICE = 4; // ريال/كجم
export const LABOR_PRICE_PER_SQM = 25; // ريال/م²
