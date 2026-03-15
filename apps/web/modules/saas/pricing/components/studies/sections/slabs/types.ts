import type { EnhancedSlabResult } from "../../../../lib/structural-calculations";
import type { StructuralFloorConfig } from "../../../../types/structural-building-config";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SlabsSectionProps {
	studyId: string;
	organizationId: string;
	items: Array<{
		id: string;
		name: string;
		subCategory?: string | null;
		quantity: number;
		dimensions: Record<string, number>;
		concreteVolume: number;
		steelWeight: number;
		totalCost: number;
	}>;
	onSave: () => void;
	onUpdate: () => void;
	specs?: { concreteType: string; steelGrade: string };
	buildingFloors?: StructuralFloorConfig[];
}

export type SlabTypeKey = "solid" | "flat" | "ribbed" | "hollow_core" | "banded_beam";
export type SlabTypeKeyOrEmpty = SlabTypeKey | "";

// ═══════════════════════════════════════════════════════════════
// كمرة السقف الصلب
// ═══════════════════════════════════════════════════════════════

export interface SlabBeamDef {
	id: string;
	name: string;
	quantity: number;
	width: number; // سم
	height: number; // سم
	length: number; // م
	topBarsCount: number;
	topBarDiameter: number;
	bottomBarsCount: number;
	bottomBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number;
}

export const getDefaultBeam = (index: number): SlabBeamDef => ({
	id: `beam-${Date.now()}-${index}`,
	name: `ك${index + 1}`,
	quantity: 1,
	width: 30,
	height: 60,
	length: 5,
	topBarsCount: 3,
	topBarDiameter: 16,
	bottomBarsCount: 4,
	bottomBarDiameter: 18,
	stirrupDiameter: 8,
	stirrupSpacing: 150,
});

// ═══════════════════════════════════════════════════════════════
// كمرة عريضة (نموذج)
// ═══════════════════════════════════════════════════════════════

export interface BandedBeamTemplateDef {
	id: string;
	name: string;        // "ك1", "ك2"
	quantity: number;
	width: number;       // meters
	depth: number;       // meters
	length: number;      // meters
	bottomContCount: number;
	bottomContDiameter: number;
	bottomAddEnabled: boolean;
	bottomAddCount: number;
	bottomAddDiameter: number;
	topContCount: number;
	topContDiameter: number;
	stirrupDiameter: number;
	stirrupSpacingQuarter: number; // cm (display)
	stirrupSpacingMid: number;    // cm
	stirrupLegs: number;          // 2 or 4
}

export const getDefaultBandedBeamTemplate = (index: number, beamLength: number): BandedBeamTemplateDef => ({
	id: `bbt-${Date.now()}-${index}`,
	name: `ك${index + 1}`,
	quantity: 1,
	width: 1.2,
	depth: 0.4,
	length: beamLength || 10,
	bottomContCount: 4,
	bottomContDiameter: 16,
	bottomAddEnabled: false,
	bottomAddCount: 2,
	bottomAddDiameter: 16,
	topContCount: 3,
	topContDiameter: 14,
	stirrupDiameter: 8,
	stirrupSpacingQuarter: 7,
	stirrupSpacingMid: 12,
	stirrupLegs: 2,
});

// ═══════════════════════════════════════════════════════════════
// FORM DATA
// ═══════════════════════════════════════════════════════════════

export interface FormData {
	name: string;
	slabType: SlabTypeKeyOrEmpty;
	floor: string;
	quantity: number;
	length: number;
	width: number;
	thickness: number;
	cover: number;
	// تسليح السقف الصلب - الشبكة السفلية
	bottomMainDiameter: number;
	bottomMainBarsPerMeter: number;
	bottomSecondaryDiameter: number;
	bottomSecondaryBarsPerMeter: number;
	// تسليح السقف الصلب - الشبكة العلوية (اختياري)
	hasTopMesh: boolean;
	topMainDiameter: number;
	topMainBarsPerMeter: number;
	topSecondaryDiameter: number;
	topSecondaryBarsPerMeter: number;
	// للهوردي
	ribWidth: number;
	ribSpacing: number;
	blockHeight: number;
	toppingThickness: number;
	ribBottomBars: number;
	ribBarDiameter: number;
	ribTopBars: number;
	ribTopBarDiameter: number;
	hasRibStirrup: boolean;
	ribStirrupDiameter: number;
	ribStirrupSpacing: number;
	// للهولوكور
	panelWidth: number;
	panelThickness: number;
	// للفلات سلاب
	hasDropPanels: boolean;
	dropPanelLength: number;
	dropPanelWidth: number;
	dropPanelDepth: number;
	dropPanelCount: number;
	// للكمرات العريضة
	bandedBeamWidth: number;
	bandedBeamDepth: number;
	bandedBeamCount: number;
}

export const getDefaultFormData = (): FormData => ({
	name: "",
	slabType: "",
	floor: "",
	quantity: 1,
	length: 0,
	width: 0,
	thickness: 15,
	cover: 0.025,
	// شبكة سفلية
	bottomMainDiameter: 12,
	bottomMainBarsPerMeter: 7,
	bottomSecondaryDiameter: 10,
	bottomSecondaryBarsPerMeter: 5,
	// شبكة علوية
	hasTopMesh: false,
	topMainDiameter: 10,
	topMainBarsPerMeter: 5,
	topSecondaryDiameter: 8,
	topSecondaryBarsPerMeter: 4,
	// هوردي
	ribWidth: 15,
	ribSpacing: 52,
	blockHeight: 20,
	toppingThickness: 5,
	ribBottomBars: 2,
	ribBarDiameter: 12,
	ribTopBars: 2,
	ribTopBarDiameter: 10,
	hasRibStirrup: true,
	ribStirrupDiameter: 8,
	ribStirrupSpacing: 200,
	// هولوكور
	panelWidth: 1.2,
	panelThickness: 20,
	// فلات سلاب
	hasDropPanels: false,
	dropPanelLength: 2,
	dropPanelWidth: 2,
	dropPanelDepth: 0.1,
	dropPanelCount: 4,
	// كمرات عريضة
	bandedBeamWidth: 1.2,
	bandedBeamDepth: 0.4,
	bandedBeamCount: 4,
});

// ═══════════════════════════════════════════════════════════════
// Component Props
// ═══════════════════════════════════════════════════════════════

export interface BeamInputRowProps {
	beam: SlabBeamDef;
	index: number;
	isExpanded: boolean;
	onToggle: () => void;
	onChange: (beam: SlabBeamDef) => void;
	onRemove: () => void;
	concreteType: string;
}

export interface FloorInfo {
	id: string;
	label: string;
	icon: string;
	slabArea: number;
	isRepeated: boolean;
	repeatCount: number;
	sortOrder: number;
}

export interface SlabFormProps {
	floorLabel: string;
	floorSlabArea?: number;
	editingItem?: SlabsSectionProps["items"][0] | null;
	onSave: () => void;
	onCancel: () => void;
	studyId: string;
	organizationId: string;
	specs?: { concreteType: string; steelGrade: string };
	allItems: SlabsSectionProps["items"];
	onDataSaved: () => void;
	onDataUpdated: () => void;
}

export interface CopyFromFloorButtonProps {
	currentFloor: string;
	floors: FloorInfo[];
	getFloorItems: (label: string, isFirst: boolean) => SlabsSectionProps["items"];
	studyId: string;
	organizationId: string;
	specs?: { concreteType: string; steelGrade: string };
	onCopied: () => void;
}

export interface SlabTypeFieldsProps {
	formData: FormData;
	setFormData: React.Dispatch<React.SetStateAction<FormData>>;
	calculations: EnhancedSlabResult | null;
	specs?: { concreteType: string; steelGrade: string };
	slabBeams: SlabBeamDef[];
	setSlabBeams: React.Dispatch<React.SetStateAction<SlabBeamDef[]>>;
	expandedBeamIds: string[];
	setExpandedBeamIds: React.Dispatch<React.SetStateAction<string[]>>;
	beamsCalcs: {
		totalConcrete: number;
		totalNetWeight: number;
		totalGrossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		allCuttingDetails: Array<{
			description: string;
			diameter: number;
			barLength: number;
			barCount: number;
			stocksNeeded: number;
			wastePerStock: number;
			totalWaste: number;
			wastePercentage: number;
			weight: number;
			stockLength: number;
			stockBarsPerUnit?: number;
			splicesPerBar?: number;
			lapSpliceLength?: number;
		}>;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
		details: Array<{ beam: SlabBeamDef; calc: any }>;
	} | null;
	bandedBeamTemplates: BandedBeamTemplateDef[];
	setBandedBeamTemplates: React.Dispatch<React.SetStateAction<BandedBeamTemplateDef[]>>;
	expandedBandedIds: string[];
	setExpandedBandedIds: React.Dispatch<React.SetStateAction<string[]>>;
	showCuttingDetails: boolean;
	setShowCuttingDetails: (v: boolean) => void;
	showFormwork: boolean;
	setShowFormwork: (v: boolean) => void;
	showBeamCutting: boolean;
	setShowBeamCutting: (v: boolean) => void;
	combinedTotals: {
		totalConcrete: number;
		totalSteel: number;
		slabConcrete: number;
		slabSteel: number;
		beamConcrete: number;
		beamSteel: number;
	} | null;
	mainDirection: string;
	secondaryDirection: string;
	mainLabel: string;
	secondaryLabel: string;
}
