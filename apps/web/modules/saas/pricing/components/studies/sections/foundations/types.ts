import type {
	IsolatedFoundationResult,
	CombinedFootingResult,
	StripFoundationResult,
	RaftFoundationResult,
} from "../../../../lib/structural-calculations";
import type { StructuralBuildingConfig } from "../../../../types/structural-building-config";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FoundationsSectionProps {
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
	buildingConfig?: StructuralBuildingConfig | null;
}

export type FoundationType = "isolated" | "combined" | "strip" | "raft";

export interface FormData {
	name: string;
	type: FoundationType;
	quantity: number;
	length: number;
	width: number;
	height: number;
	cover: number;
	hookLength: number;
	// حديد الفرش القصير (سفلي)
	bottomShortDiameter: number;
	bottomShortBarsPerMeter: number;
	// حديد الفرش الطويل (سفلي)
	bottomLongDiameter: number;
	bottomLongBarsPerMeter: number;
	// حديد الغطاء القصير (علوي)
	hasTopShort: boolean;
	topShortDiameter: number;
	topShortBarsPerMeter: number;
	// حديد الغطاء الطويل (علوي)
	hasTopLong: boolean;
	topLongDiameter: number;
	topLongBarsPerMeter: number;
	// حقول مشتركة للمنفصلة والمشتركة
	foundationCoverBottom: number;
	foundationCoverTop: number;
	foundationCoverSide: number;
	foundationHasLeanConcrete: boolean;
	foundationLeanConcreteThickness: number;
	foundationHasColumnDowels: boolean;
	foundationDowelBarsPerColumn: number;
	foundationDowelDiameter: number;
	foundationDowelDevLength: number;
	// خاص بالمشتركة
	combinedColumnCount: number;
	combinedColumnSpacing: number;
	// للقواعد الشريطية
	stripLength: number;
	segments: Array<{ length: number }>; // backward compat
	bottomMainCount: number;
	bottomMainDiameter: number;
	hasBottomSecondary: boolean;
	bottomSecondaryCount: number;
	bottomSecondaryDiameter: number;
	hasTopMain: boolean;
	topMainCount: number;
	topMainDiameter: number;
	hasStirrup: boolean;
	stirrupDiameter: number;
	stirrupSpacing: number;
	// شريطية — mesh mode
	stripBottomMeshXDiameter: number;
	stripBottomMeshXBarsPerMeter: number;
	stripBottomMeshYDiameter: number;
	stripBottomMeshYBarsPerMeter: number;
	stripHasTopMesh: boolean;
	stripTopMeshXDiameter: number;
	stripTopMeshXBarsPerMeter: number;
	stripTopMeshYDiameter: number;
	stripTopMeshYBarsPerMeter: number;
	// شريطية — إعدادات متقدمة
	stripCoverBottom: number;
	stripCoverTop: number;
	stripCoverSide: number;
	stripHasLeanConcrete: boolean;
	stripLeanConcreteThickness: number;
	stripHasColumnDowels: boolean;
	stripColumnDowelCount: number;
	stripColumnDowelBarsPerColumn: number;
	stripColumnDowelDiameter: number;
	stripColumnDowelDevLength: number;
	stripHasIntersectionDeduction: boolean;
	stripIntersectionCount: number;
	stripIntersectingStripWidth: number;
	stripHasChairBars: boolean;
	stripChairBarsDiameter: number;
	stripChairBarsSpacingX: number;
	stripChairBarsSpacingY: number;
	stripLapSpliceMethod: '40d' | '50d' | '60d' | 'custom';
	stripCustomLapLength: number;
	stripShowAdvanced: boolean;
	// للبشة
	thickness: number;
	bottomXDiameter: number;
	bottomXBarsPerMeter: number;
	bottomYDiameter: number;
	bottomYBarsPerMeter: number;
	hasTopMesh: boolean;
	topXDiameter: number;
	topXBarsPerMeter: number;
	topYDiameter: number;
	topYBarsPerMeter: number;
	// إعدادات اللبشة المتقدمة
	coverBottom: number;
	coverTop: number;
	coverSide: number;
	hasLeanConcrete: boolean;
	leanConcreteThickness: number;
	hasEdgeBeams: boolean;
	edgeBeamWidth: number;
	edgeBeamDepth: number;
	lapSpliceMethod: '40d' | '50d' | '60d' | 'custom';
	customLapLength: number;
	hasChairBars: boolean;
	chairBarsDiameter: number;
	chairBarsSpacingX: number;
	chairBarsSpacingY: number;
	columnDowelMode: 'none' | 'manual';
	columnDowelCount: number;
	columnDowelBarsPerColumn: number;
	columnDowelDiameter: number;
	columnDowelDevLength: number;
}

export const FOUNDATION_TYPE_INFO: Record<FoundationType, { nameAr: string; description: string }> = {
	isolated: { nameAr: "قاعدة معزولة", description: "قاعدة منفصلة لعمود واحد" },
	combined: { nameAr: "قاعدة مشتركة", description: "قاعدة لعدة أعمدة" },
	strip: { nameAr: "قاعدة شريطية", description: "قاعدة شريطية متصلة" },
	raft: { nameAr: "لبشة", description: "قاعدة حصيرية كاملة" },
};

export type CalculationResult = IsolatedFoundationResult | CombinedFootingResult | StripFoundationResult | RaftFoundationResult;

export const getDefaultFormData = (config?: StructuralBuildingConfig | null): FormData => ({
	name: "",
	type: "isolated",
	quantity: 1,
	length: 0,
	width: 0,
	height: config?.heightProperties?.foundationDepth
		? config.heightProperties.foundationDepth / 100  // سم → م
		: 0.6,
	cover: 0.075,
	hookLength: 0.10,
	// فرش قصير سفلي
	bottomShortDiameter: 16,
	bottomShortBarsPerMeter: 5,
	// فرش طويل سفلي
	bottomLongDiameter: 16,
	bottomLongBarsPerMeter: 5,
	// غطاء قصير علوي
	hasTopShort: true,
	topShortDiameter: 12,
	topShortBarsPerMeter: 4,
	// غطاء طويل علوي
	hasTopLong: true,
	topLongDiameter: 12,
	topLongBarsPerMeter: 4,
	// حقول المنفصلة والمشتركة
	foundationCoverBottom: 0.075,
	foundationCoverTop: 0.05,
	foundationCoverSide: 0.05,
	foundationHasLeanConcrete: false,
	foundationLeanConcreteThickness: config?.heightProperties?.plainConcreteThickness
		? config.heightProperties.plainConcreteThickness / 100  // سم → م
		: 0.10,
	foundationHasColumnDowels: false,
	foundationDowelBarsPerColumn: 4,
	foundationDowelDiameter: 16,
	foundationDowelDevLength: 0.60,
	// مشتركة
	combinedColumnCount: 2,
	combinedColumnSpacing: 0,
	// شريطية
	stripLength: 10,
	segments: [{ length: 10 }],
	bottomMainCount: 6,
	bottomMainDiameter: 16,
	hasBottomSecondary: false,
	bottomSecondaryCount: 4,
	bottomSecondaryDiameter: 12,
	hasTopMain: false,
	topMainCount: 4,
	topMainDiameter: 12,
	hasStirrup: true,
	stirrupDiameter: 10,
	stirrupSpacing: 200,
	// شريطية — mesh mode
	stripBottomMeshXDiameter: 16,
	stripBottomMeshXBarsPerMeter: 5,
	stripBottomMeshYDiameter: 16,
	stripBottomMeshYBarsPerMeter: 5,
	stripHasTopMesh: false,
	stripTopMeshXDiameter: 12,
	stripTopMeshXBarsPerMeter: 4,
	stripTopMeshYDiameter: 12,
	stripTopMeshYBarsPerMeter: 4,
	// شريطية — إعدادات متقدمة
	stripCoverBottom: 0.075,
	stripCoverTop: 0.05,
	stripCoverSide: 0.05,
	stripHasLeanConcrete: false,
	stripLeanConcreteThickness: 0.10,
	stripHasColumnDowels: false,
	stripColumnDowelCount: 0,
	stripColumnDowelBarsPerColumn: 4,
	stripColumnDowelDiameter: 16,
	stripColumnDowelDevLength: 0.80,
	stripHasIntersectionDeduction: false,
	stripIntersectionCount: 0,
	stripIntersectingStripWidth: 0.45,
	stripHasChairBars: false,
	stripChairBarsDiameter: 10,
	stripChairBarsSpacingX: 1.0,
	stripChairBarsSpacingY: 1.0,
	stripLapSpliceMethod: '40d' as const,
	stripCustomLapLength: 0.8,
	stripShowAdvanced: false,
	// لبشة
	thickness: 0.6,
	bottomXDiameter: 16,
	bottomXBarsPerMeter: 5,
	bottomYDiameter: 16,
	bottomYBarsPerMeter: 5,
	hasTopMesh: true,
	topXDiameter: 12,
	topXBarsPerMeter: 4,
	topYDiameter: 12,
	topYBarsPerMeter: 4,
	// إعدادات اللبشة المتقدمة
	coverBottom: 0.075,
	coverTop: 0.075,
	coverSide: 0.075,
	hasLeanConcrete: true,
	leanConcreteThickness: 0.10,
	hasEdgeBeams: false,
	edgeBeamWidth: 0.3,
	edgeBeamDepth: 0.3,
	lapSpliceMethod: '40d',
	customLapLength: 0.8,
	hasChairBars: false,
	chairBarsDiameter: 10,
	chairBarsSpacingX: 1.0,
	chairBarsSpacingY: 1.0,
	columnDowelMode: 'none',
	columnDowelCount: 0,
	columnDowelBarsPerColumn: 4,
	columnDowelDiameter: 16,
	columnDowelDevLength: 0.8,
});

export function populateFormFromItem(item: FoundationsSectionProps["items"][0]): FormData {
	return {
		name: item.name,
		type: (item.subCategory as FoundationType) || "isolated",
		quantity: item.quantity,
		length: item.dimensions?.length || 0,
		width: item.dimensions?.width || 0,
		height: item.dimensions?.height || 0.6,
		cover: item.dimensions?.cover || 0.075,
		hookLength: item.dimensions?.hookLength || 0.10,
		bottomShortDiameter: item.dimensions?.bottomShortDiameter || 16,
		bottomShortBarsPerMeter: item.dimensions?.bottomShortBarsPerMeter || 5,
		bottomLongDiameter: item.dimensions?.bottomLongDiameter || 16,
		bottomLongBarsPerMeter: item.dimensions?.bottomLongBarsPerMeter || 5,
		hasTopShort: item.dimensions?.hasTopShort !== undefined ? !!item.dimensions.hasTopShort : true,
		topShortDiameter: item.dimensions?.topShortDiameter || 12,
		topShortBarsPerMeter: item.dimensions?.topShortBarsPerMeter || 4,
		hasTopLong: item.dimensions?.hasTopLong !== undefined ? !!item.dimensions.hasTopLong : true,
		topLongDiameter: item.dimensions?.topLongDiameter || 12,
		topLongBarsPerMeter: item.dimensions?.topLongBarsPerMeter || 4,
		foundationCoverBottom: item.dimensions?.foundationCoverBottom || 0.075,
		foundationCoverTop: item.dimensions?.foundationCoverTop || 0.05,
		foundationCoverSide: item.dimensions?.foundationCoverSide || 0.05,
		foundationHasLeanConcrete: item.dimensions?.foundationHasLeanConcrete !== undefined ? !!item.dimensions.foundationHasLeanConcrete : false,
		foundationLeanConcreteThickness: item.dimensions?.foundationLeanConcreteThickness || 0.10,
		foundationHasColumnDowels: item.dimensions?.foundationHasColumnDowels !== undefined ? !!item.dimensions.foundationHasColumnDowels : false,
		foundationDowelBarsPerColumn: item.dimensions?.foundationDowelBarsPerColumn || 4,
		foundationDowelDiameter: item.dimensions?.foundationDowelDiameter || 16,
		foundationDowelDevLength: item.dimensions?.foundationDowelDevLength || 0.60,
		combinedColumnCount: item.dimensions?.combinedColumnCount || 2,
		combinedColumnSpacing: item.dimensions?.combinedColumnSpacing || 0,
		stripLength: item.dimensions?.stripLength || item.dimensions?.segmentLength || 10,
		segments: [{ length: item.dimensions?.stripLength || item.dimensions?.segmentLength || 10 }],
		bottomMainCount: item.dimensions?.bottomMainCount || 6,
		bottomMainDiameter: item.dimensions?.bottomMainDiameter || 16,
		hasBottomSecondary: item.dimensions?.hasBottomSecondary !== undefined ? !!item.dimensions.hasBottomSecondary : false,
		bottomSecondaryCount: item.dimensions?.bottomSecondaryCount || 4,
		bottomSecondaryDiameter: item.dimensions?.bottomSecondaryDiameter || 12,
		hasTopMain: item.dimensions?.hasTopMain !== undefined ? !!item.dimensions.hasTopMain : false,
		topMainCount: item.dimensions?.topMainCount || 4,
		topMainDiameter: item.dimensions?.topMainDiameter || 12,
		hasStirrup: item.dimensions?.hasStirrup !== undefined ? !!item.dimensions.hasStirrup : true,
		stirrupDiameter: item.dimensions?.stirrupDiameter || 10,
		stirrupSpacing: item.dimensions?.stirrupSpacing || 200,
		stripBottomMeshXDiameter: item.dimensions?.stripBottomMeshXDiameter || 16,
		stripBottomMeshXBarsPerMeter: item.dimensions?.stripBottomMeshXBarsPerMeter || 5,
		stripBottomMeshYDiameter: item.dimensions?.stripBottomMeshYDiameter || 16,
		stripBottomMeshYBarsPerMeter: item.dimensions?.stripBottomMeshYBarsPerMeter || 5,
		stripHasTopMesh: item.dimensions?.stripHasTopMesh !== undefined ? !!item.dimensions.stripHasTopMesh : false,
		stripTopMeshXDiameter: item.dimensions?.stripTopMeshXDiameter || 12,
		stripTopMeshXBarsPerMeter: item.dimensions?.stripTopMeshXBarsPerMeter || 4,
		stripTopMeshYDiameter: item.dimensions?.stripTopMeshYDiameter || 12,
		stripTopMeshYBarsPerMeter: item.dimensions?.stripTopMeshYBarsPerMeter || 4,
		stripCoverBottom: item.dimensions?.stripCoverBottom || 0.075,
		stripCoverTop: item.dimensions?.stripCoverTop || 0.05,
		stripCoverSide: item.dimensions?.stripCoverSide || 0.05,
		stripHasLeanConcrete: item.dimensions?.stripHasLeanConcrete !== undefined ? !!item.dimensions.stripHasLeanConcrete : false,
		stripLeanConcreteThickness: item.dimensions?.stripLeanConcreteThickness || 0.10,
		stripHasColumnDowels: item.dimensions?.stripHasColumnDowels !== undefined ? !!item.dimensions.stripHasColumnDowels : false,
		stripColumnDowelCount: item.dimensions?.stripColumnDowelCount || 0,
		stripColumnDowelBarsPerColumn: item.dimensions?.stripColumnDowelBarsPerColumn || 4,
		stripColumnDowelDiameter: item.dimensions?.stripColumnDowelDiameter || 16,
		stripColumnDowelDevLength: item.dimensions?.stripColumnDowelDevLength || 0.80,
		stripHasIntersectionDeduction: item.dimensions?.stripHasIntersectionDeduction !== undefined ? !!item.dimensions.stripHasIntersectionDeduction : false,
		stripIntersectionCount: item.dimensions?.stripIntersectionCount || 0,
		stripIntersectingStripWidth: item.dimensions?.stripIntersectingStripWidth || 0.45,
		stripHasChairBars: item.dimensions?.stripHasChairBars !== undefined ? !!item.dimensions.stripHasChairBars : false,
		stripChairBarsDiameter: item.dimensions?.stripChairBarsDiameter || 10,
		stripChairBarsSpacingX: item.dimensions?.stripChairBarsSpacingX || 1.0,
		stripChairBarsSpacingY: item.dimensions?.stripChairBarsSpacingY || 1.0,
		stripLapSpliceMethod: (String(item.dimensions?.stripLapSpliceMethod || '40d') as FormData['stripLapSpliceMethod']),
		stripCustomLapLength: item.dimensions?.stripCustomLapLength || 0.8,
		stripShowAdvanced: false,
		thickness: item.dimensions?.thickness || 0.6,
		bottomXDiameter: item.dimensions?.bottomXDiameter || 16,
		bottomXBarsPerMeter: item.dimensions?.bottomXBarsPerMeter || 5,
		bottomYDiameter: item.dimensions?.bottomYDiameter || 16,
		bottomYBarsPerMeter: item.dimensions?.bottomYBarsPerMeter || 5,
		hasTopMesh: item.dimensions?.hasTopMesh !== undefined ? !!item.dimensions.hasTopMesh : true,
		topXDiameter: item.dimensions?.topXDiameter || 12,
		topXBarsPerMeter: item.dimensions?.topXBarsPerMeter || 4,
		topYDiameter: item.dimensions?.topYDiameter || 12,
		topYBarsPerMeter: item.dimensions?.topYBarsPerMeter || 4,
		coverBottom: item.dimensions?.coverBottom || 0.075,
		coverTop: item.dimensions?.coverTop || 0.075,
		coverSide: item.dimensions?.coverSide || 0.075,
		hasLeanConcrete: item.dimensions?.hasLeanConcrete !== undefined ? !!item.dimensions.hasLeanConcrete : true,
		leanConcreteThickness: item.dimensions?.leanConcreteThickness || 0.10,
		hasEdgeBeams: item.dimensions?.hasEdgeBeams !== undefined ? !!item.dimensions.hasEdgeBeams : false,
		edgeBeamWidth: item.dimensions?.edgeBeamWidth || 0.3,
		edgeBeamDepth: item.dimensions?.edgeBeamDepth || 0.3,
		lapSpliceMethod: (String(item.dimensions?.lapSpliceMethod || '40d') as FormData['lapSpliceMethod']),
		customLapLength: item.dimensions?.customLapLength || 0.8,
		hasChairBars: item.dimensions?.hasChairBars !== undefined ? !!item.dimensions.hasChairBars : false,
		chairBarsDiameter: item.dimensions?.chairBarsDiameter || 10,
		chairBarsSpacingX: item.dimensions?.chairBarsSpacingX || 1.0,
		chairBarsSpacingY: item.dimensions?.chairBarsSpacingY || 1.0,
		columnDowelMode: (String(item.dimensions?.columnDowelMode || 'none') as FormData['columnDowelMode']),
		columnDowelCount: item.dimensions?.columnDowelCount || 0,
		columnDowelBarsPerColumn: item.dimensions?.columnDowelBarsPerColumn || 4,
		columnDowelDiameter: item.dimensions?.columnDowelDiameter || 16,
		columnDowelDevLength: item.dimensions?.columnDowelDevLength || 0.8,
	};
}

export interface FoundationFieldsProps {
	formData: FormData;
	setFormData: React.Dispatch<React.SetStateAction<FormData>>;
	calculations: CalculationResult | null;
	showCuttingDetails: boolean;
	setShowCuttingDetails: (v: boolean) => void;
	specs?: { concreteType: string; steelGrade: string };
}
