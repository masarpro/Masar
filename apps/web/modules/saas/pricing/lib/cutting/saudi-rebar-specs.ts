// ═══════════════════════════════════════════════════════════════════════════
// مواصفات حديد التسليح في السوق السعودي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * أطوال قضبان الحديد المتاحة في السعودية
 */
export const SAUDI_REBAR_LENGTHS = {
	standard: [12], // الطول القياسي 12 متر
	available: [6, 9, 12], // الأطوال المتاحة من المصانع
	coil: { // اللفات (للأقطار الصغيرة فقط)
		diameters: [6, 8, 10], // الأقطار المتاحة كلفات
		minLength: 50, // أقل طول للفة بالمتر
	}
} as const;

/**
 * مواصفات حديد التسليح (حسب ASTM/SASO)
 */
export const REBAR_SPECIFICATIONS = {
	// وزن المتر الطولي بالكجم (حسب ASTM/SASO)
	weightPerMeter: {
		6: 0.222,
		8: 0.395,
		10: 0.617,
		12: 0.888,
		14: 1.208,
		16: 1.578,
		18: 1.998,
		20: 2.466,
		22: 2.984,
		25: 3.853,
		28: 4.834,
		32: 6.313,
	} as Record<number, number>,

	// أقل طول قطعة يمكن استخدامها
	minimumUsableLength: 0.3, // 30 سم

	// طول الوصلة (overlap) حسب القطر
	lapLength: (diameter: number): number => {
		// 40d بالمتر (حسب الكود السعودي)
		return (diameter * 40) / 1000;
	},

	// عرض شفرة القص (بالأمتار)
	bladeWidth: 0.005, // 5 مم

	// الأطوال المتاحة حسب القطر
	getAvailableLengths: (diameter: number): number[] => {
		// القطر 8 مم يأتي بطول 6 متر فقط
		if (diameter === 8) {
			return [6];
		}
		// باقي الأقطار تأتي بأطوال متعددة (6، 9، 12)
		// لكن الأكثر شيوعاً هو 12 متر
		return [12];
	},
} as const;

/**
 * أسعار الحديد (كجم) - تقديرية (يجب تحديثها حسب السوق)
 */
export const REBAR_PRICES: Record<number, number> = {
	6: 2.0,
	8: 2.2,
	10: 2.5,
	12: 2.8,
	14: 3.0,
	16: 3.2,
	18: 3.5,
	20: 3.8,
	22: 4.0,
	25: 4.5,
	28: 5.0,
	32: 5.5,
};

/**
 * معايير الصناعة للهدر
 */
export const INDUSTRY_BENCHMARKS = {
	industryAverage: 8,      // متوسط الصناعة 8%
	bestPractice: 5,         // أفضل الممارسات 5%
	excellent: 3,            // ممتاز < 3%
	good: 5,                 // جيد 3-5%
	average: 8,              // متوسط 5-8%
	poor: 10,                // ضعيف > 8%
} as const;

/**
 * الحصول على سعر الحديد حسب القطر
 */
export function getRebarPrice(diameter: number): number {
	return REBAR_PRICES[diameter] || 3.0; // افتراضي 3 ريال/كجم
}

/**
 * الحصول على وزن الحديد حسب القطر والطول
 */
export function getRebarWeight(diameter: number, length: number): number {
	const weightPerMeter = REBAR_SPECIFICATIONS.weightPerMeter[diameter];
	if (!weightPerMeter) {
		return 0;
	}
	return length * weightPerMeter;
}
