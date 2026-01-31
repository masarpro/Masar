// ═══════════════════════════════════════════════════════════════════════════
// أنواع TypeScript لنظام القص المحسّن
// ═══════════════════════════════════════════════════════════════════════════

/**
 * قطعة مطلوبة للقص
 */
export interface CuttingPiece {
	id: string;
	length: number;      // الطول بالمتر
	quantity: number;    // العدد المطلوب
	priority?: number;   // أولوية القص (للقطع الحرجة) - 1 = أعلى أولوية
	canJoin?: boolean;   // هل يمكن وصل القطعة؟ (lap splice)
	location?: string;   // الموقع (للتتبع)
	source?: string;     // المصدر (أي عنصر إنشائي)
}

/**
 * طلب القص
 */
export interface CuttingRequest {
	diameter: number;           // قطر السيخ
	pieces: CuttingPiece[];    // القطع المطلوبة
	stockLengths: number[];    // أطوال القضبان المتاحة (مثل [6, 9, 12])
	bladeWidth?: number;        // عرض شفرة القص (عادة 3-5 مم) - افتراضي 0.005
	minUsableRemnant?: number;  // أقل فضلة يمكن استخدامها - افتراضي 0.3
	allowJoining?: boolean;     // هل يسمح بالوصلات؟ - افتراضي true
}

/**
 * قطع في نمط القص
 */
export interface Cut {
	pieceId: string;
	length: number;
	quantity: number;
	position?: number;  // موضع القطع في السيخ (للتخيل)
}

/**
 * نمط قص واحد
 */
export interface CuttingPattern {
	stockLength: number;       // طول القضيب المستخدم
	barCount: number;          // عدد القضبان بهذا النمط
	cuts: Cut[];               // القطع في هذا النمط
	remnant: number;           // الفضلة المتبقية
	efficiency: number;        // كفاءة النمط (%)
	usedRemnant?: string;      // ID الفضلة المستخدمة (إن وجدت)
}

/**
 * فضلة قابلة لإعادة الاستخدام
 */
export interface Remnant {
	id: string;
	length: number;
	diameter: number;
	quantity: number;
	suggestedUse: string[];    // الاستخدامات المقترحة
	source?: string;            // من أين أتت
	dateAdded?: Date;           // تاريخ الإضافة
}

/**
 * نتيجة القص المحسّن
 */
export interface CuttingResult {
	patterns: CuttingPattern[];      // أنماط القص
	totalBars: number;               // إجمالي القضبان
	totalNetLength: number;          // الطول الصافي
	totalGrossLength: number;        // الطول الإجمالي
	wasteLength: number;             // طول الهدر
	wastePercentage: number;         // نسبة الهدر
	reusableRemnants: Remnant[];     // الفضلات القابلة لإعادة الاستخدام
	costSavings?: number;             // التوفير بالريال
	utilizationRate: number;          // معدل الاستفادة
	algorithm: string;                // اسم الخوارزمية المستخدمة
	executionTime?: number;            // وقت التنفيذ (بالميلي ثانية)
	// معلومات تراكب الوصل (lap splices) للبحور الطويلة
	lapSpliceLength?: number;        // إجمالي طول تراكب الوصل (م)
	lapSpliceJoints?: number;        // عدد وصلات التراكب
	actualWasteLength?: number;      // الهدر الفعلي (بعد استبعاد تراكب الوصل)
	hasLongSpans?: boolean;          // هل يوجد بحور طويلة (>12م)
}

/**
 * تقرير الهدر
 */
export interface WasteReport {
	summary: {
		totalNetWeight: number;      // الوزن الصافي
		totalGrossWeight: number;    // الوزن الإجمالي
		wasteWeight: number;         // وزن الهدر
		wastePercentage: number;     // نسبة الهدر
		reusableWeight: number;      // وزن الفضلات القابلة للاستخدام
		actualWasteWeight: number;   // الهدر الفعلي (بعد إعادة الاستخدام)
		actualWastePercentage: number;
		estimatedCost: number;       // تكلفة الحديد
		potentialSavings: number;    // التوفير المحتمل
	};

	byDiameter: {
		[diameter: number]: {
			netWeight: number;
			grossWeight: number;
			wasteWeight: number;
			wastePercentage: number;
			barCount: number;
			patterns: CuttingPattern[];
		};
	};

	recommendations: Recommendation[];

	benchmarks: {
		industryAverage: number;     // متوسط الصناعة (5-8%)
		bestPractice: number;        // أفضل الممارسات (3-5%)
		current: number;             // الحالي
		rating: 'excellent' | 'good' | 'average' | 'poor';
	};
}

/**
 * توصية لتقليل الهدر
 */
export interface Recommendation {
	type: 'design' | 'procurement' | 'execution';
	priority: 'high' | 'medium' | 'low';
	description: string;
	potentialSaving: number;
	implementation: string;
}

/**
 * مخزون الفضلات
 */
export interface WasteInventory {
	projectId: string;
	remnants: StoredRemnant[];
	lastUpdated: Date;
}

/**
 * فضلة مخزنة
 */
export interface StoredRemnant {
	id: string;
	diameter: number;
	length: number;
	quantity: number;
	source: string;           // من أين أتت (أي عنصر إنشائي)
	dateAdded: Date;
	status: 'available' | 'reserved' | 'used';
	reservedFor?: string;     // محجوزة لأي عنصر
}
