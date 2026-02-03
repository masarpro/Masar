// ═══════════════════════════════════════════════════════════════════════════
// أنواع البلاطات - Slabs Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع البلاطة
 */
export type SlabType = 'solid' | 'flat' | 'ribbed' | 'hollow_core' | 'banded_beam';

// ─────────────────────────────────────────────────────────────────────────────
// البيانات الأساسية المشتركة لجميع الأسقف
// ─────────────────────────────────────────────────────────────────────────────

export interface SlabBase {
	id: string;
	name: string;                    // س1، س2...
	type: SlabType;
	floorName: string;               // "أرضي"، "أول"...
	quantity: number;                // عدد الأسقف المتشابهة

	// الأبعاد الإجمالية
	dimensions: {
		length: number;                // الطول (م)
		width: number;                 // العرض (م)
		grossArea: number;             // المساحة الإجمالية (م²)
		inputMethod?: 'dimensions' | 'area';
	};

	// الفتحات والاستثناءات
	openings: SlabOpening[];

	// حالة الإكمال
	isComplete: boolean;

	// نوع الخرسانة
	concreteType?: string;

	// ملاحظات
	notes?: string;
}

/**
 * فتحة في السقف
 */
export interface SlabOpening {
	id: string;
	name: string;                    // "فتحة درج"، "فتحة مصعد"...
	shape: 'rectangular' | 'circular';
	dimensions: {
		length?: number;
		width?: number;
		diameter?: number;
	};
	area: number;
}

/**
 * طبقة تسليح واحدة
 */
export interface RebarLayer {
	diameter: number;                // القطر (مم)
	spacing: number;                 // التباعد (م)
	count?: number;                  // عدد الأسياخ (بديل للتباعد)
	length: number;                  // طول السيخ (م)
	extensions: {
		anchorage: number;             // التثبيت
		lap: number;                   // التراكب
		hooks: number;                 // الخطافات
	};
}

/**
 * حديد إضافي
 */
export interface AdditionalRebar {
	id: string;
	description: string;             // "حديد إضافي فوق العمود"
	diameter: number;
	length: number;
	count: number;
}

/**
 * تسليح الكمرة
 */
export interface BeamReinforcement {
	top: { count: number; diameter: number };
	bottom: {
		straight: { count: number; diameter: number };
		bent?: { count: number; diameter: number };
	};
	stirrups: {
		diameter: number;
		spacing: number;
		legs: number;
	};
}

/**
 * كمرة مرتبطة بالسقف
 */
export interface SlabBeam {
	id: string;
	name: string;                    // "ك1"، "ك2"...
	type: 'drop' | 'hidden' | 'edge';
	dimensions: {
		width: number;
		depth: number;
		length: number;
	};
	reinforcement: BeamReinforcement;
	quantity?: number;
	volume?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ السقف الصلب (Solid Slab)
// ─────────────────────────────────────────────────────────────────────────────

export interface SolidSlab extends SlabBase {
	type: 'solid';
	subType: 'one_way' | 'two_way';
	thickness: number;

	// الكمرات المرتبطة
	dropBeams?: SlabBeam[];
	hiddenBeams?: SlabBeam[];

	// التسليح
	reinforcement: {
		inputMethod: 'detailed' | 'grid' | 'ratio';
		grid?: {
			bottom: {
				xDirection: { diameter: number; spacing: number };
				yDirection: { diameter: number; spacing: number };
			};
			top?: {
				xDirection?: { diameter: number; spacing: number };
				yDirection?: { diameter: number; spacing: number };
			};
		};
		ratio?: number;
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ الفلات سلاب (Flat Slab)
// ─────────────────────────────────────────────────────────────────────────────

export interface FlatSlab extends SlabBase {
	type: 'flat';
	thickness: number;

	// شبكة الأعمدة
	columnGrid: {
		xSpacing: number[];
		ySpacing: number[];
		columnSize: { width: number; depth: number };
	};

	// Drop Panels
	hasDropPanels: boolean;
	dropPanels?: {
		width: number;
		depth: number;
		extraThickness: number;
	};

	// Column Capitals
	hasCapitals: boolean;
	capitals?: {
		topDiameter: number;
		bottomDiameter: number;
		height: number;
	};

	// التسليح
	reinforcement: {
		inputMethod: 'strips' | 'detailed' | 'ratio';
		strips?: {
			columnStrip: {
				width: number;
				bottom: RebarLayer;
				top: RebarLayer;
			};
			middleStrip: {
				width: number;
				bottom: RebarLayer;
				top?: RebarLayer;
			};
		};
		punchingShear?: {
			type: 'studs' | 'links' | 'stirrups';
			details: unknown;
		};
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ الهوردي (Ribbed/Hordi Slab)
// ─────────────────────────────────────────────────────────────────────────────

export interface RibbedSlab extends SlabBase {
	type: 'ribbed';
	ribDirection: 'x' | 'y' | 'both';

	// أبعاد النظام
	system: {
		toppingThickness: number;
		ribWidth: number;
		ribDepth: number;
		ribSpacing: number;
		block: {
			width: number;
			length: number;
			height: number;
			type: 'concrete' | 'foam' | 'eps' | 'other';
			customTypeName?: string;
		};
		isCustomBlockSize?: boolean;
	};

	// الكمرات
	dropBeams?: SlabBeam[];
	hiddenBeams?: SlabBeam[];

	// التسليح
	reinforcement: {
		ribs: {
			bottom: { count: number; diameter: number };
			top?: {
				enabled: boolean;
				count: number;
				diameter: number;
			};
			stirrups?: {
				enabled?: boolean;
				diameter: number;
				spacing: number;
			};
		};
		topping: {
			mesh?: {
				xDirection: { diameter: number; spacing: number };
				yDirection: { diameter: number; spacing: number };
			};
			distribution?: { diameter: number; spacing: number };
		};
		supportRebar?: AdditionalRebar[];
	};

	// إعدادات متقدمة
	advanced?: {
		anchorageLength?: number;
		openingReinforcement?: boolean;
		formworkType?: 'traditional' | 'deck' | 'table';
		cover?: number;
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣ الهولوكور / البانيل (Hollow-core Panels)
// ─────────────────────────────────────────────────────────────────────────────

export interface HollowCoreSlab extends SlabBase {
	type: 'hollow_core';

	// مواصفات الألواح
	panels: {
		thickness: number;
		width: number;
		supplier?: string;
	};

	// Topping
	hasTopping: boolean;
	topping?: {
		thickness: number;
		reinforcement: {
			mesh: {
				xDirection: { diameter: number; spacing: number };
				yDirection: { diameter: number; spacing: number };
			};
		};
	};

	// Grout
	grout: {
		keyway: boolean;
		bearingPads: boolean;
	};

	// الاتصالات
	connections?: {
		diaphragmSteel?: AdditionalRebar[];
		tieRods?: { diameter: number; count: number };
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 5️⃣ الكمرات العريضة (Banded Beam Slab)
// ─────────────────────────────────────────────────────────────────────────────

export type BandDirection = 'x' | 'y' | 'both';

export interface BandedBeam {
	id: string;
	name: string;
	direction: 'x' | 'y';
	position?: number;
	dimensions: {
		width: number;
		depth: number;
		length: number;
	};
	reinforcement: BeamReinforcement;
	quantity: number;
	volume?: number;
}

export interface BandedBeamSlab extends SlabBase {
	type: 'banded_beam';
	bandDirection: BandDirection;

	dimensions: {
		length: number;
		width: number;
		thickness: number;
		grossArea: number;
		inputMethod: 'dimensions' | 'area';
	};

	// الكمرات العريضة
	bands: BandedBeam[];
	dropBeams?: SlabBeam[];

	// تسليح البلاطة
	reinforcement: {
		bottom: {
			xDirection: { diameter: number; spacing: number };
			yDirection: { diameter: number; spacing: number };
		};
		top?: {
			enabled: boolean;
			xDirection: {
				diameter: number;
				spacing: number;
				length: number;
			};
			yDirection: {
				diameter: number;
				spacing: number;
				length: number;
			};
		};
	};

	advanced?: {
		anchorageLength: number;
		formworkType: 'traditional' | 'deck' | 'table';
		cover: number;
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Union Type لجميع الأسقف
// ─────────────────────────────────────────────────────────────────────────────

export type Slab = SolidSlab | FlatSlab | RibbedSlab | HollowCoreSlab | BandedBeamSlab;

// ─────────────────────────────────────────────────────────────────────────────
// نتائج الحساب
// ─────────────────────────────────────────────────────────────────────────────

export interface RebarDetail {
	id: string;
	description: string;
	location: string;
	diameter: number;
	barLength: number;
	barCount: number;
	totalLength: number;
	weight: number;
	stockLength: number;
	stocksNeeded: number;
	wastePercentage: number;
	cutting?: {
		cutsPerStock: number;
		wastePerStock: number;
		totalWaste: number;
		netLength: number;
		grossLength: number;
		utilizationRate: number;
		stocksNeeded: number;
		stockLength: number;
	};
}

export interface SlabCalculation {
	slabId: string;
	slabName: string;
	slabType: SlabType;

	// الخرسانة
	concrete: {
		slab: number;
		beams: number;
		dropPanels?: number;
		ribs?: number;
		topping?: number;
		total: number;
		withWaste: number;
	};

	// الحديد
	rebar: {
		details: RebarDetail[];
		totals: {
			netWeight: number;
			grossWeight: number;
			wasteWeight: number;
			wastePercentage: number;
			stocksNeeded: { diameter: number; count: number; length: number }[];
			lapSpliceWeight?: number;
			actualWasteWeight?: number;
			actualWastePercentage?: number;
			hasLongSpans?: boolean;
		};
	};

	// الشدات
	formwork: {
		slabBottom: number;
		beamSides?: number;
		beamBottom?: number;
		dropPanels?: number;
		total: number;
		withWaste: number;
	};

	// البنود الخاصة
	specialItems: {
		blocks?: {
			count: number;
			withWaste: number;
			type: string;
		};
		panels?: {
			count: number;
			totalArea: number;
		};
		grout?: {
			volume: number;
		};
	};

	// الملخص
	summary: {
		concreteVolume: number;
		rebarWeight: number;
		rebarWeightNet?: number;
		rebarRatio: number;
		formworkArea: number;
		numberOfRibs?: number;
		ribLength?: number;
	};
}
