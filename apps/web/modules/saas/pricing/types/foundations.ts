// ═══════════════════════════════════════════════════════════════════════════
// أنواع القواعد - Foundations Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع القاعدة
 */
export type FoundationType =
	| 'isolated'    // قاعدة منفصلة
	| 'combined'    // قاعدة مشتركة
	| 'strip'       // قاعدة شريطية
	| 'raft';       // لبشة

/**
 * بيانات القاعدة المنفصلة (المدخلات)
 */
export interface IsolatedFoundationInput {
	id?: string;
	name?: string;
	quantity: number;

	// أبعاد القاعدة
	length: number;      // م
	width: number;       // م
	height: number;      // م (الارتفاع/العمق)

	// الإعدادات
	cover?: number;       // غطاء خرساني (م) - افتراضي 0.075
	hookLength?: number;  // طول الرجوع (م) - افتراضي 0.10

	// أغطية منفصلة (اختياري — تستبدل cover الموحد)
	coverBottom?: number;  // افتراضي 0.075م
	coverTop?: number;     // افتراضي 0.05م
	coverSide?: number;    // افتراضي 0.05م

	// التسليح السفلي (الاتجاه القصير)
	bottomShort?: { barsPerMeter: number; diameter: number };
	// التسليح السفلي (الاتجاه الطويل)
	bottomLong?: { barsPerMeter: number; diameter: number };

	// التسليح العلوي (اختياري)
	topShort?: { barsPerMeter: number; diameter: number };
	topLong?: { barsPerMeter: number; diameter: number };

	// خرسانة النظافة
	hasLeanConcrete?: boolean;         // افتراضي false
	leanConcreteThickness?: number;    // افتراضي 0.10م

	// حديد انتظار العمود (عمود واحد فقط)
	hasColumnDowels?: boolean;         // افتراضي false
	columnDowels?: {
		barsPerColumn: number;           // 4, 6, 8
		diameter: number;                // مم
		developmentLength: number;       // م
	};

	// نوع الخرسانة (اختياري)
	concreteType?: string;
}

/**
 * بيانات القاعدة المشتركة
 */
export interface CombinedFoundationInput {
	id?: string;
	name?: string;
	quantity: number;

	// أبعاد القاعدة
	length: number;
	width: number;
	height: number;  // الارتفاع/العمق

	// عدد الأعمدة على القاعدة
	columnsCount?: number;
	columnsSpacing?: number;
	columnCount?: number;              // عدد الأعمدة (الافتراضي: 2)
	columnSpacing?: number;            // المسافة بين الأعمدة (م)

	// الإعدادات
	cover?: number;
	hookLength?: number;

	// أغطية منفصلة (اختياري)
	coverBottom?: number;  // افتراضي 0.075م
	coverTop?: number;     // افتراضي 0.05م
	coverSide?: number;    // افتراضي 0.05م

	// التسليح السفلي (بنفس نمط المنفصلة)
	bottomShort?: { barsPerMeter: number; diameter: number };
	bottomLong?: { barsPerMeter: number; diameter: number };

	// التسليح العلوي
	topShort?: { barsPerMeter: number; diameter: number };
	topLong?: { barsPerMeter: number; diameter: number };

	// خرسانة النظافة
	hasLeanConcrete?: boolean;         // افتراضي true
	leanConcreteThickness?: number;    // افتراضي 0.10م

	// حديد انتظار الأعمدة
	hasColumnDowels?: boolean;         // افتراضي false
	columnDowels?: {
		barsPerColumn: number;           // 4, 6, 8
		diameter: number;                // مم
		developmentLength: number;       // م
	};

	// نوع الخرسانة
	concreteType?: string;
}

/**
 * بيانات القاعدة الشريطية
 */
export interface StripFoundationInput {
	id?: string;
	name?: string;
	quantity?: number;

	// الأبعاد
	length: number;      // الطول الكلي (م)
	width: number;       // العرض (م)
	height: number;      // الارتفاع/العمق (م)

	// backward compat — old saved items may still have segments
	segments?: Array<{ length: number }>;

	// الإعدادات
	cover?: number;
	hookLength?: number;

	// أغطية منفصلة
	coverBottom?: number;  // افتراضي 0.075م
	coverTop?: number;     // افتراضي 0.05م
	coverSide?: number;    // افتراضي 0.05م

	// خرسانة النظافة
	hasLeanConcrete?: boolean;
	leanConcreteThickness?: number; // افتراضي 0.10م

	// التسليح السفلي — وضع الكانات (stirrups)
	bottomMain: { count: number; diameter: number };
	bottomSecondary?: { count: number; diameter: number };

	// التسليح العلوي — وضع الكانات
	topMain?: { count: number; diameter: number };

	// الكانات — وضع الكانات فقط
	stirrups?: {
		diameter: number;
		spacing: number;
	};

	// التسليح السفلي — وضع الشبكة (mesh)
	bottomMeshX?: { diameter: number; barsPerMeter: number };
	bottomMeshY?: { diameter: number; barsPerMeter: number };

	// التسليح العلوي — وضع الشبكة
	topMeshX?: { diameter: number; barsPerMeter: number };
	topMeshY?: { diameter: number; barsPerMeter: number };

	// وصلة التراكب (mesh فقط)
	lapSpliceMethod?: '40d' | '50d' | '60d' | 'custom';
	customLapLength?: number;

	// كراسي حديد (mesh فقط)
	hasChairBars?: boolean;
	chairBars?: { diameter: number; spacingX: number; spacingY: number };

	// أسياخ انتظار الأعمدة
	hasColumnDowels?: boolean;
	columnDowels?: {
		count: number;
		barsPerColumn: number;
		diameter: number;
		developmentLength: number;
	};

	// خصم التقاطعات
	hasIntersectionDeduction?: boolean;
	intersectionCount?: number;
	intersectingStripWidth?: number; // عرض الشريط المتقاطع (م)

	// نوع الخرسانة (اختياري)
	concreteType?: string;
}

/**
 * بيانات اللبشة
 */
export interface RaftFoundationInput {
	id?: string;
	name?: string;

	// الأبعاد
	length: number;
	width: number;
	thickness: number;

	// الإعدادات
	cover?: number;
	hookLength?: number;           // default 0.10m
	coverBottom?: number;          // default 0.075m
	coverTop?: number;             // default 0.075m
	coverSide?: number;            // default 0.075m

	// خرسانة النظافة
	hasLeanConcrete?: boolean;     // default true
	leanConcreteThickness?: number; // default 0.10m

	// تسميك الحواف
	hasEdgeBeams?: boolean;        // default false
	edgeBeamWidth?: number;        // m (0.3-0.5)
	edgeBeamDepth?: number;        // m (0.2-0.5)

	// وصلة التراكب
	lapSpliceMethod?: '40d' | '50d' | '60d' | 'custom';
	customLapLength?: number;      // m, only when method='custom'

	// كراسي حديد
	hasChairBars?: boolean;
	chairBars?: { diameter: number; spacingX: number; spacingY: number };

	// أسياخ انتظار الأعمدة
	columnDowels?: {
		count: number;               // عدد الأعمدة
		barsPerColumn: number;       // 4, 6, 8, etc.
		diameter: number;            // mm
		developmentLength: number;   // m
	};

	// التسليح السفلي
	bottomX: { diameter: number; barsPerMeter: number };
	bottomY: { diameter: number; barsPerMeter: number };

	// التسليح العلوي (اختياري)
	topX?: { diameter: number; barsPerMeter: number };
	topY?: { diameter: number; barsPerMeter: number };

	// حديد إضافي (تقوية عند الأعمدة)
	additionalRebar?: {
		description: string;
		diameter: number;
		length: number;
		count: number;
	}[];

	// نوع الخرسانة (اختياري)
	concreteType?: string;
}

/**
 * نتيجة حساب نوع واحد من الحديد
 */
export interface FoundationRebarCalculation {
	direction: string;        // "فرش قصير"، "فرش طويل"...
	diameter: number;
	barLength: number;        // طول السيخ المقطوع
	barCount: number;         // عدد الأسياخ للقاعدة الواحدة
	totalBars: number;        // إجمالي الأسياخ لكل القواعد

	// حساب القص
	stockLength: number;      // طول سيخ المصنع (12 أو 6)
	cutsPerStock: number;     // عدد القطع من السيخ الواحد
	stocksNeeded: number;     // عدد أسياخ المصنع المطلوبة

	// الفضلات
	wastePerStock: number;    // فضلة كل سيخ
	totalWaste: number;       // إجمالي الفضلات (متر)
	wastePercentage: number;  // نسبة الهالك %

	// الأوزان
	netWeight: number;        // الوزن الصافي
	grossWeight: number;      // الوزن مع الهالك
	wasteWeight: number;      // وزن الهالك
}

/**
 * ملخص القاعدة
 */
export interface FoundationSummary {
	// حجم الخرسانة
	concreteVolume: number;
	plainConcreteVolume: number;

	// تفاصيل كل نوع حديد
	rebarDetails: FoundationRebarCalculation[];

	// الإجماليات
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: { diameter: number; count: number; length: number }[];
	};

	// الفضلات
	waste: {
		diameter: number;
		length: number;
		count: number;
		suggestedUse: string;
	}[];
}

/**
 * Union Type للقواعد
 */
export type FoundationInput =
	| IsolatedFoundationInput
	| CombinedFoundationInput
	| StripFoundationInput
	| RaftFoundationInput;
