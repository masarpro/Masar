// ═══════════════════════════════════════════════════════════════════════════
// أنواع البلوك والجدران - Blocks Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع البلوك
 */
export type BlockType =
	| 'hollow'        // مفرغ عادي
	| 'solid'         // مصمت
	| 'insulated'     // عازل (ساندويتش)
	| 'fire_rated'    // مقاوم للحريق
	| 'lightweight'   // خفيف (بركاني/خلوي)
	| 'aac';          // خرسانة خلوية AAC

/**
 * تصنيف الجدار
 */
export type WallCategory =
	| 'external'      // خارجي
	| 'internal'      // داخلي
	| 'partition'     // فاصل خفيف
	| 'boundary'      // سور
	| 'retaining'     // استنادي
	| 'parapet';      // دروة سطح

/**
 * مقاس البلوك
 */
export interface BlockSize {
	thickness: number;    // السماكة (سم): 10, 15, 20, 25, 30
	length: number;       // الطول (سم): عادة 40
	height: number;       // الارتفاع (سم): عادة 20
	blocksPerSqm: number; // عدد البلوك/م²
}

/**
 * نوع الفتحة
 */
export type OpeningType = 'door' | 'window' | 'ac' | 'vent' | 'other';

/**
 * فتحة في الجدار
 */
export interface WallOpening {
	id: string;
	type: OpeningType;
	name: string;           // "باب رئيسي"، "نافذة غرفة 1"
	width: number;          // العرض (م)
	height: number;         // الارتفاع (م)
	quantity: number;       // العدد
	area: number;           // المساحة الكلية (محسوبة)

	// للأبواب
	doorType?: 'single' | 'double' | 'sliding';

	// للنوافذ
	windowType?: 'single' | 'double' | 'sliding' | 'fixed';
	sillHeight?: number;    // ارتفاع الرخامة من الأرض
}

/**
 * الجدار
 */
export interface Wall {
	id: string;
	name: string;           // "جدار خارجي شمالي"، "ج1"

	// التصنيف
	category: WallCategory;
	floorName: string;      // "أرضي"، "أول"، "متكرر"

	// الأبعاد
	dimensions: {
		length: number;       // الطول (م)
		height: number;       // الارتفاع (م)
		grossArea: number;    // المساحة الإجمالية (محسوبة)
	};

	// البلوك
	block: {
		type: BlockType;
		thickness: number;    // سماكة البلوك (سم)
		size: BlockSize;
	};

	// الفتحات
	openings: WallOpening[];

	// خيارات إضافية
	options: {
		hasLintel: boolean;       // هل يوجد أعتاب؟
		lintelHeight: number;     // ارتفاع العتب (م)
		hasSillBeam: boolean;     // هل يوجد شناجات نوافذ؟
		plastered: 'none' | 'one_side' | 'both_sides';
	};

	// العدد (تكرار)
	quantity: number;
}

/**
 * طريقة الإدخال السريع
 */
export type QuickInputMethod =
	| 'single_wall'       // جدار واحد
	| 'room_perimeter'    // محيط غرفة
	| 'floor_plan'        // مسقط كامل
	| 'import_excel';     // استيراد من Excel

export interface RoomPerimeter {
	id: string;
	name: string;           // "غرفة نوم 1"
	perimeter: number;      // المحيط (م)
	height: number;         // الارتفاع (م)
	openings: WallOpening[];
	blockThickness: number;
}

/**
 * نتيجة حساب الجدار
 */
export interface WallCalculation {
	wallId: string;
	wallName: string;

	// المساحات
	areas: {
		gross: number;          // المساحة الإجمالية
		openings: number;       // مساحة الفتحات
		net: number;            // المساحة الصافية
	};

	// البلوك
	blocks: {
		type: string;
		thickness: number;
		blocksPerSqm: number;
		netCount: number;        // العدد الصافي
		wastePercentage: number;
		wasteCount: number;      // عدد الهدر
		grossCount: number;      // العدد الإجمالي
	};

	// المونة
	mortar: {
		volumePerSqm: number;    // م³/م²
		totalVolume: number;     // الحجم الكلي
		cementBags: number;      // عدد شكاير الأسمنت
		sandVolume: number;      // حجم الرمل
	};

	// الأعتاب (إن وجدت)
	lintels?: {
		count: number;
		totalLength: number;
		concreteVolume: number;
		rebarWeight: number;
	};
}

/**
 * ملخص إجمالي للبلوك
 */
export interface BlocksSummary {
	// إجمالي حسب سماكة البلوك
	byThickness: {
		thickness: number;
		type: BlockType;
		totalArea: number;
		totalBlocks: number;
		category: WallCategory;
	}[];

	// إجمالي حسب التصنيف
	byCategory: {
		category: WallCategory;
		totalArea: number;
		totalBlocks: number;
	}[];

	// إجمالي حسب الدور
	byFloor: {
		floorName: string;
		totalArea: number;
		totalBlocks: number;
	}[];

	// الإجماليات
	totals: {
		wallsCount: number;
		grossArea: number;
		openingsArea: number;
		netArea: number;
		totalBlocks: number;
		totalBlocksWithWaste: number;
		mortarVolume: number;
		cementBags: number;
		sandVolume: number;
	};
}
