// ═══════════════════════════════════════════════════════════════════════════
// ثوابت العناصر الإنشائية الإضافية
// Other Structural Elements Constants
// ═══════════════════════════════════════════════════════════════════════════

// ===== نسب التسليح المرجعية (كجم حديد / م³ خرسانة) =====
// مبنية على SBC 304 / ACI 318 + الممارسة السعودية

export const STEEL_RATIOS = {
	// بيارة / خزان
	TANK_BASE: 90,
	TANK_WALLS: 100,
	TANK_SLAB: 80,
	TANK_DIVIDER: 85,

	// بئر مصعد
	ELEVATOR_PIT_SLAB: 130,
	ELEVATOR_WALLS: 90,
	ELEVATOR_MACHINE_SLAB: 110,

	// جدار استنادي
	RETAINING_STEM: 95,
	RETAINING_BASE: 100,
	RETAINING_COUNTERFORT: 90,

	// سور خارجي
	BOUNDARY_COLUMN: 110,
	BOUNDARY_FOUNDATION: 80,
	BOUNDARY_BEAM: 90,

	// رامب
	RAMP_SLAB: 85,
	RAMP_WALLS: 80,

	// قبة
	DOME_SHELL: 50,
	DOME_RING_BEAM: 120,
	DOME_DRUM: 80,
	DOME_COLUMN: 110,

	// مأذنة
	MINARET_SHAFT: 100,
	MINARET_BALCONY: 90,
	MINARET_FOUNDATION: 120,

	// عام
	PLAIN_CONCRETE: 0,
} as const;

// ===== نسبة الهدر للحديد =====
export const STEEL_WASTE_PERCENT = 5;

// ===== سمك صبة النظافة =====
export const LEAN_CONCRETE_THICKNESS = 0.10;

// ===== بلوك =====
export const BLOCK_DIMENSIONS = {
	BLOCK_20: { length: 0.40, height: 0.20, width: 0.20, mortarPerBlock: 0.001 },
	BLOCK_15: { length: 0.40, height: 0.20, width: 0.15, mortarPerBlock: 0.0008 },
} as const;

// ===== أبعاد بئر المصعد حسب الحمولة =====
export const ELEVATOR_STANDARD_SIZES = [
	{ capacity: 320, persons: 4, width: 1.40, depth: 1.50, pitDepth: 1.2 },
	{ capacity: 400, persons: 5, width: 1.60, depth: 1.60, pitDepth: 1.2 },
	{ capacity: 480, persons: 6, width: 1.80, depth: 1.70, pitDepth: 1.2 },
	{ capacity: 630, persons: 8, width: 1.80, depth: 2.00, pitDepth: 1.5 },
	{ capacity: 1000, persons: 13, width: 2.10, depth: 2.30, pitDepth: 1.5 },
] as const;

// ===== الأنماط المعمارية للمآذن =====
export const MINARET_STYLE_FACTORS = {
	MODERN: {
		shapeDefault: 'CYLINDRICAL' as const,
		heightMultiplier: 1.0,
		wallThicknessDefault: 25,
		diameterDefault: 2.0,
		description_ar: 'حديث',
		description_en: 'Modern',
	},
	ANDALUSIAN: {
		shapeDefault: 'SQUARE' as const,
		heightMultiplier: 1.0,
		wallThicknessDefault: 30,
		diameterDefault: 2.5,
		description_ar: 'أندلسي',
		description_en: 'Andalusian',
	},
	OTTOMAN: {
		shapeDefault: 'CYLINDRICAL' as const,
		heightMultiplier: 1.2,
		wallThicknessDefault: 22,
		diameterDefault: 1.8,
		description_ar: 'عثماني',
		description_en: 'Ottoman',
	},
	MAMLUK: {
		shapeDefault: 'OCTAGONAL' as const,
		heightMultiplier: 1.0,
		wallThicknessDefault: 28,
		diameterDefault: 2.2,
		description_ar: 'مملوكي',
		description_en: 'Mamluk',
	},
	ABBASID: {
		shapeDefault: 'CYLINDRICAL' as const,
		heightMultiplier: 0.9,
		wallThicknessDefault: 30,
		diameterDefault: 3.0,
		description_ar: 'عباسي',
		description_en: 'Abbasid',
	},
	MAGHREBI: {
		shapeDefault: 'SQUARE' as const,
		heightMultiplier: 1.0,
		wallThicknessDefault: 30,
		diameterDefault: 2.5,
		description_ar: 'مغربي',
		description_en: 'Maghrebi',
	},
} as const;

// ===== أوزان GRC =====
export const GRC_WEIGHT_PER_SQM = 50;
export const GRC_WEIGHT_PER_LM_CORNICE = 25;

// ===== القيم الافتراضية لكل عنصر =====
export const ELEMENT_DEFAULTS = {
	SEPTIC_TANK: {
		depth: 1.5, wallThickness: 20, baseThickness: 25, slabThickness: 15,
		wallType: 'RC' as const, tankType: 'SEALED' as const,
	},
	WATER_TANK_GROUND: {
		depth: 1.7, wallThickness: 25, baseThickness: 30, slabThickness: 20,
		shape: 'RECTANGULAR' as const, isDivided: false,
	},
	WATER_TANK_ELEVATED: {
		depth: 1.5, wallThickness: 20, baseThickness: 25, slabThickness: 15,
		shape: 'RECTANGULAR' as const,
	},
	ELEVATOR_PIT: {
		pitWidth: 1.6, pitLength: 1.6, pitHoleDepth: 1.2, numberOfStops: 3,
		floorHeight: 3.2, wallThickness: 25, pitSlabThickness: 25,
		overTravel: 3.5, hasMachineRoom: false, machineRoomHeight: 2.5,
		elevatorType: 'ELECTRIC_MRL' as const,
	},
	RETAINING_WALL: {
		stemThickness: 25, baseThickness: 30,
		wallType: 'CANTILEVER' as const,
	},
	BOUNDARY_WALL: {
		height: 2.5, thickness: 20, columnSpacing: 3.5,
		hasRCColumns: true, hasFoundation: true,
		foundationWidth: 50, foundationDepth: 50,
		wallType: 'BLOCK_WALL' as const,
	},
	RAMP: {
		thickness: 20, hasWalls: true, wallHeight: 100, wallThickness: 20,
		rampType: 'CAR_RAMP' as const,
	},
	DOME: {
		domeType: 'HALF_SPHERE' as const,
		shellThicknessTop: 10, shellThicknessBottom: 15,
		hasRingBeam: true, ringBeamWidth: 30, ringBeamDepth: 60,
		hasDrum: false, hasSupportColumns: false,
	},
	MINARET: {
		shape: 'CYLINDRICAL' as const, style: 'MODERN' as const,
		wallThickness: 25, hasBalcony: true, balconyCount: 1,
		balconyProjection: 80, topType: 'CONE' as const,
		outerDiameter: 2.0,
	},
} as const;

// ===== بيانات واجهة العرض لكل عنصر =====
export const ELEMENT_CATALOG = [
	{
		type: 'SEPTIC_TANK' as const,
		name_ar: 'بيارة (خزان صرف صحي)',
		name_en: 'Septic Tank',
		icon: '🕳️',
		color: 'amber',
		priority: 0,
	},
	{
		type: 'WATER_TANK_GROUND' as const,
		name_ar: 'خزان مياه أرضي',
		name_en: 'Ground Water Tank',
		icon: '💧',
		color: 'blue',
		priority: 0,
	},
	{
		type: 'WATER_TANK_ELEVATED' as const,
		name_ar: 'خزان مياه علوي',
		name_en: 'Elevated Water Tank',
		icon: '🏗️',
		color: 'sky',
		priority: 1,
	},
	{
		type: 'ELEVATOR_PIT' as const,
		name_ar: 'بئر مصعد',
		name_en: 'Elevator Pit',
		icon: '🛗',
		color: 'slate',
		priority: 0,
	},
	{
		type: 'RETAINING_WALL' as const,
		name_ar: 'جدار استنادي',
		name_en: 'Retaining Wall',
		icon: '🧱',
		color: 'orange',
		priority: 1,
	},
	{
		type: 'BOUNDARY_WALL' as const,
		name_ar: 'سور خارجي',
		name_en: 'Boundary Wall / Fence',
		icon: '🏰',
		color: 'stone',
		priority: 0,
	},
	{
		type: 'RAMP' as const,
		name_ar: 'رامب / منحدر',
		name_en: 'Ramp',
		icon: '📐',
		color: 'zinc',
		priority: 1,
	},
	{
		type: 'DOME' as const,
		name_ar: 'قبة',
		name_en: 'Dome',
		icon: '🕌',
		color: 'emerald',
		priority: 2,
	},
	{
		type: 'MINARET' as const,
		name_ar: 'مأذنة (منارة)',
		name_en: 'Minaret',
		icon: '🗼',
		color: 'teal',
		priority: 2,
	},
	{
		type: 'CONCRETE_DECOR' as const,
		name_ar: 'كرانيش وديكورات خرسانية',
		name_en: 'Concrete Decorations / GRC',
		icon: '🏛️',
		color: 'purple',
		priority: 1,
	},
	{
		type: 'CUSTOM_ELEMENT' as const,
		name_ar: 'عنصر مخصص',
		name_en: 'Custom Element',
		icon: '✏️',
		color: 'gray',
		priority: 1,
	},
] as const;
