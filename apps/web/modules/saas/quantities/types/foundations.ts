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
	id: string;
	name: string;
	quantity: number;

	// أبعاد القاعدة
	length: number;      // م
	width: number;       // م
	depth: number;       // م

	// الإعدادات
	cover: number;       // غطاء خرساني (م) - افتراضي 0.075
	hookLength: number;  // طول الرجوع (م) - افتراضي 0.40

	// التسليح السفلي (الاتجاه القصير)
	bottomShort: { barsPerMeter: number; diameter: number };
	// التسليح السفلي (الاتجاه الطويل)
	bottomLong: { barsPerMeter: number; diameter: number };

	// التسليح العلوي (اختياري)
	topShort?: { barsPerMeter: number; diameter: number };
	topLong?: { barsPerMeter: number; diameter: number };
}

/**
 * بيانات القاعدة المشتركة
 */
export interface CombinedFoundationInput {
	id: string;
	name: string;
	quantity: number;

	// أبعاد القاعدة
	length: number;
	width: number;
	depth: number;

	// عدد الأعمدة على القاعدة
	columnsCount: number;
	columnPositions?: { x: number; y: number }[];

	// الإعدادات
	cover: number;
	hookLength: number;

	// التسليح الرئيسي (الاتجاه الطويل)
	mainRebar: { barsPerMeter: number; diameter: number };
	// التسليح الثانوي (الاتجاه القصير)
	distributionRebar: { barsPerMeter: number; diameter: number };

	// التسليح العلوي
	topMainRebar?: { barsPerMeter: number; diameter: number };
	topDistributionRebar?: { barsPerMeter: number; diameter: number };
}

/**
 * بيانات القاعدة الشريطية
 */
export interface StripFoundationInput {
	id: string;
	name: string;
	quantity: number;

	// الأبعاد
	length: number;      // الطول الكلي (م)
	width: number;       // العرض (م)
	depth: number;       // العمق (م)

	// طريقة إدخال الطول
	lengthInput: {
		method: 'direct' | 'segments';
		segments?: number[];
		directLength?: number;
	};

	// الإعدادات
	cover: number;
	hookLength: number;

	// التسليح السفلي
	bottomMain: { count: number; diameter: number };
	bottomDistribution: { barsPerMeter: number; diameter: number };

	// التسليح العلوي
	topMain?: { count: number; diameter: number };
	topDistribution?: { barsPerMeter: number; diameter: number };

	// الكانات
	stirrups?: {
		diameter: number;
		spacing: number;
	};
}

/**
 * بيانات اللبشة
 */
export interface RaftFoundationInput {
	id: string;
	name: string;

	// الأبعاد
	length: number;
	width: number;
	thickness: number;

	// الإعدادات
	cover: number;

	// التسليح السفلي
	bottomX: { diameter: number; spacing: number };
	bottomY: { diameter: number; spacing: number };

	// التسليح العلوي
	topX: { diameter: number; spacing: number };
	topY: { diameter: number; spacing: number };

	// حديد إضافي (تقوية عند الأعمدة)
	additionalRebar?: {
		description: string;
		diameter: number;
		length: number;
		count: number;
	}[];
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
