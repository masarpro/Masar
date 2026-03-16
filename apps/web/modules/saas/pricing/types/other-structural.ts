// ═══════════════════════════════════════════════════════════════════════════
// أنواع العناصر الإنشائية الإضافية - Other Structural Element Types
// ═══════════════════════════════════════════════════════════════════════════

// النوع الرئيسي للعنصر
export type OtherStructuralElementType =
	| 'SEPTIC_TANK'         // بيارة
	| 'WATER_TANK_GROUND'   // خزان أرضي
	| 'WATER_TANK_ELEVATED' // خزان علوي
	| 'ELEVATOR_PIT'        // بئر مصعد
	| 'RETAINING_WALL'      // جدار استنادي
	| 'BOUNDARY_WALL'       // سور خارجي
	| 'RAMP'                // رامب / منحدر
	| 'DOME'                // قبة
	| 'MINARET'             // مأذنة
	| 'CONCRETE_DECOR'      // كرانيش وديكورات خرسانية
	| 'CUSTOM_ELEMENT';     // عنصر مخصص

// ===== 1. البيارة =====
export type SepticTankType = 'SEALED' | 'OPEN' | 'TWO_CHAMBER' | 'PRECAST';
export type WallConstructionType = 'RC' | 'BLOCK_20' | 'BLOCK_15';

export interface SepticTankInput {
	id: string;
	elementType: 'SEPTIC_TANK';
	name: string;
	tankType: SepticTankType;
	length: number;
	width: number;
	depth: number;
	wallType: WallConstructionType;
	wallThickness: number;       // سم
	baseThickness: number;       // سم
	slabThickness: number;       // سم
	quantity: number;
}

// ===== 2. خزان مياه أرضي =====
export type TankShape = 'RECTANGULAR' | 'CYLINDRICAL';

export interface GroundWaterTankInput {
	id: string;
	elementType: 'WATER_TANK_GROUND';
	name: string;
	shape: TankShape;
	length?: number;
	width?: number;
	diameter?: number;
	depth: number;
	wallThickness: number;       // سم
	baseThickness: number;       // سم
	slabThickness: number;       // سم
	isDivided: boolean;
	quantity: number;
}

// ===== 3. خزان مياه علوي =====
export interface ElevatedWaterTankInput {
	id: string;
	elementType: 'WATER_TANK_ELEVATED';
	name: string;
	shape: TankShape;
	length?: number;
	width?: number;
	diameter?: number;
	depth: number;
	wallThickness: number;       // سم
	baseThickness: number;       // سم
	slabThickness: number;       // سم
	quantity: number;
}

// ===== 4. بئر المصعد =====
export type ElevatorType = 'ELECTRIC_WITH_ROOM' | 'ELECTRIC_MRL' | 'HYDRAULIC';

export interface ElevatorPitInput {
	id: string;
	elementType: 'ELEVATOR_PIT';
	name: string;
	elevatorType: ElevatorType;
	pitWidth: number;
	pitLength: number;
	pitHoleDepth: number;
	numberOfStops: number;
	floorHeight: number;
	wallThickness: number;       // سم
	pitSlabThickness: number;    // سم
	overTravel: number;
	hasMachineRoom: boolean;
	machineRoomHeight?: number;
	quantity: number;
}

// ===== 5. جدار استنادي =====
export type RetainingWallType = 'CANTILEVER' | 'GRAVITY' | 'COUNTERFORT';

export interface RetainingWallInput {
	id: string;
	elementType: 'RETAINING_WALL';
	name: string;
	wallType: RetainingWallType;
	length: number;
	height: number;
	stemThickness: number;       // سم
	baseWidth: number;
	baseThickness: number;       // سم
	quantity: number;
}

// ===== 6. سور خارجي =====
export type BoundaryWallType = 'BLOCK_WALL' | 'RC_WALL' | 'PRECAST';

export interface BoundaryWallInput {
	id: string;
	elementType: 'BOUNDARY_WALL';
	name: string;
	wallType: BoundaryWallType;
	length: number;
	height: number;
	thickness: number;           // سم
	hasRCColumns: boolean;
	columnSpacing: number;
	hasFoundation: boolean;
	foundationWidth: number;     // سم
	foundationDepth: number;     // سم
	quantity: number;
}

// ===== 7. رامب =====
export type RampType = 'CAR_RAMP' | 'PEDESTRIAN_RAMP' | 'LOADING_RAMP';

export interface RampInput {
	id: string;
	elementType: 'RAMP';
	name: string;
	rampType: RampType;
	length: number;
	width: number;
	thickness: number;           // سم
	hasWalls: boolean;
	wallHeight: number;          // سم
	wallThickness: number;       // سم
	quantity: number;
}

// ===== 8. القبة =====
export type DomeType = 'HALF_SPHERE' | 'POINTED' | 'RIBBED' | 'GRC_PRECAST';

export interface DomeInput {
	id: string;
	elementType: 'DOME';
	name: string;
	domeType: DomeType;
	diameter: number;
	riseHeight: number;
	shellThicknessTop: number;    // سم
	shellThicknessBottom: number; // سم
	hasRingBeam: boolean;
	ringBeamWidth: number;        // سم
	ringBeamDepth: number;        // سم
	hasDrum: boolean;
	drumHeight?: number;
	drumThickness?: number;       // سم
	hasSupportColumns: boolean;
	supportColumnCount?: number;
	supportColumnHeight?: number;
	supportColumnSize?: number;   // سم
	quantity: number;
}

// ===== 9. المأذنة =====
export type MinaretShape = 'CYLINDRICAL' | 'SQUARE' | 'OCTAGONAL';
export type MinaretStyle = 'MODERN' | 'ANDALUSIAN' | 'OTTOMAN' | 'MAMLUK' | 'ABBASID' | 'MAGHREBI';

export interface MinaretInput {
	id: string;
	elementType: 'MINARET';
	name: string;
	shape: MinaretShape;
	style: MinaretStyle;
	totalHeight: number;
	outerDiameter?: number;
	sideLength?: number;
	wallThickness: number;        // سم
	hasBalcony: boolean;
	balconyCount: number;
	balconyProjection: number;    // سم
	topType: 'DOME_SMALL' | 'CONE' | 'GRC';
	quantity: number;
}

// ===== 10. كرانيش وديكورات =====
export type DecorItemType =
	| 'CORNICE' | 'COLUMN_DECORATIVE' | 'CAPITAL' | 'WINDOW_FRAME'
	| 'FRONTON' | 'CORBEL' | 'PANEL' | 'BALUSTRADE' | 'BALUSTER'
	| 'MASHRABIYA' | 'CLADDING' | 'BELT' | 'OTHER_DECOR';
export type DecorMaterial = 'GRC' | 'GRP' | 'RC' | 'STONE';
export type DecorUnit = 'LINEAR_METER' | 'SQM' | 'PIECE';

export interface ConcreteDecorItem {
	id: string;
	type: DecorItemType;
	material: DecorMaterial;
	unit: DecorUnit;
	length?: number;
	area?: number;
	height?: number;              // سم
	width?: number;               // سم
	quantity: number;
	description?: string;
}

export interface ConcreteDecorInput {
	id: string;
	elementType: 'CONCRETE_DECOR';
	name: string;
	items: ConcreteDecorItem[];
	quantity: number;
}

// ===== 11. عنصر مخصص =====
export interface CustomElementInput {
	id: string;
	elementType: 'CUSTOM_ELEMENT';
	name: string;
	description?: string;
	concreteVolumeRC: number;
	concreteVolumePlain: number;
	steelWeight: number;
	formworkArea: number;
	waterproofingArea: number;
	excavationVolume: number;
	blockCount: number;
	quantity: number;
}

// ===== نوع الإدخال الموحد (Union) =====
export type OtherStructuralInput =
	| SepticTankInput
	| GroundWaterTankInput
	| ElevatedWaterTankInput
	| ElevatorPitInput
	| RetainingWallInput
	| BoundaryWallInput
	| RampInput
	| DomeInput
	| MinaretInput
	| ConcreteDecorInput
	| CustomElementInput;

// ===== المخرج الموحد لكل عنصر =====
export interface ComponentBreakdown {
	component: string;
	componentEn: string;
	concreteVolume: number;
	steelWeight: number;
	formworkArea: number;
}

export interface OtherStructuralResult {
	elementType: OtherStructuralElementType;
	name: string;
	quantity: number;

	// الإجماليات (لعنصر واحد)
	concreteVolumeRC: number;
	concreteVolumePlain: number;
	steelWeight: number;
	formworkArea: number;
	waterproofingArea: number;
	excavationVolume: number;
	blockCount: number;
	mortarVolume: number;

	// الإجماليات (× الكمية)
	totalConcreteRC: number;
	totalConcretePlain: number;
	totalSteelWeight: number;
	totalFormwork: number;

	// التفصيل
	breakdown: ComponentBreakdown[];
}
