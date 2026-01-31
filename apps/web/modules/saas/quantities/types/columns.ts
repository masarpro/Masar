// ═══════════════════════════════════════════════════════════════════════════
// أنواع الأعمدة - Columns Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع العمود
 */
export type ColumnType = 'rectangular' | 'circular';

/**
 * بيانات العمود (المدخلات)
 */
export interface ColumnInput {
	id: string;
	name: string;
	quantity: number;
	type?: ColumnType;

	// أبعاد العمود (مستطيل)
	width: number;        // سم
	depth: number;        // سم
	height: number;       // م

	// أبعاد العمود (دائري)
	diameter?: number;    // سم

	// الإعدادات
	cover: number;        // كفر (م)
	hookLength: number;   // طول الرجوع (م)

	// التسليح الرئيسي
	mainBars: {
		diameter: number;
		count: number;
	}[];

	// الكانات
	stirrups: {
		diameter: number;
		spacing: number;   // سم
		legs: number;      // عدد الأرجل (2، 4، 6)
		shape?: 'rectangular' | 'diamond' | 'spiral';
	};
}

/**
 * نتيجة حساب نوع واحد من الحديد
 */
export interface ColumnRebarCalculation {
	direction: string;        // "أسياخ رئيسية"، "كانات"...
	diameter: number;
	barLength: number;        // طول السيخ المقطوع
	barCount: number;         // عدد الأسياخ للعمود الواحد
	totalBars: number;        // إجمالي الأسياخ لكل الأعمدة

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
 * ملخص العمود
 */
export interface ColumnSummary {
	// حجم الخرسانة
	concreteVolume: number;

	// تفاصيل كل نوع حديد
	rebarDetails: ColumnRebarCalculation[];

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
 * بيانات رقبة العمود (Neck Column)
 */
export interface NeckColumnInput extends Omit<ColumnInput, 'height'> {
	height: number;       // م - عادة أقصر من العمود
	copyToColumn?: boolean;  // نسخ البيانات للعمود
}
