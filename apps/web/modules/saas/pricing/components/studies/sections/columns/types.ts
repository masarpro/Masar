import type { StructuralFloorConfig, StructuralBuildingConfig } from "../../../../types/structural-building-config";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ItemType {
	id: string;
	name: string;
	subCategory?: string | null;
	quantity: number;
	dimensions: Record<string, number>;
	concreteVolume: number;
	steelWeight: number;
	totalCost: number;
}

export interface ColumnsSectionProps {
	studyId: string;
	organizationId: string;
	items: ItemType[];
	allItems?: Array<{ category: string; dimensions: Record<string, any>; subCategory?: string | null }>;
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
	buildingFloors?: StructuralFloorConfig[];
	buildingConfig?: StructuralBuildingConfig | null;
}

export interface FloorDef {
	id: string;
	label: string;
	icon: string;
	hasNeckColumns?: boolean;
	isRepeated?: boolean;
}

export interface FloorColumnsPanelProps {
	floor: FloorDef;
	studyId: string;
	organizationId: string;
	items: ItemType[];
	specs?: { concreteType: string; steelGrade: string };
	onSave: () => void;
	onUpdate: () => void;
	allItemsCount: number;
	derivedColumnHeight?: number | null;
}

export interface NeckColumnsSectionProps {
	groundColumns: ItemType[];
	neckHeight: number;
	onNeckHeightChange: (h: number) => void;
	onDisable: () => void;
	specs?: { concreteType: string; steelGrade: string };
}

export interface CopyFromFloorButtonProps {
	currentFloorId: string;
	currentFloorLabel: string;
	floors: FloorDef[];
	getFloorItems: (floorId: string) => ItemType[];
	studyId: string;
	organizationId: string;
	specs?: { concreteType: string; steelGrade: string };
	onCopied: () => void;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_FLOORS: FloorDef[] = [
	{ id: "ground", label: "الدور الأرضي", icon: "🏠", hasNeckColumns: true },
	{ id: "first", label: "الدور الأول", icon: "🏢" },
	{ id: "mezzanine", label: "الميزانين", icon: "📐" },
	{ id: "repeated", label: "الدور المتكرر", icon: "🔁", isRepeated: true },
	{ id: "annex", label: "الملحق", icon: "🏗️" },
];

export const NECK_HEIGHT_PRESETS = [1, 1.5, 2, 3, 4];
