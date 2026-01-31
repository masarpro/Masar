// ═══════════════════════════════════════════════════════════════════════════
// أنواع الكمرات - Beams Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع الكمرة
 */
export type BeamType = 'drop' | 'hidden' | 'upstand' | 'ground';

/**
 * بيانات الكمرة (المدخلات)
 */
export interface BeamInput {
	id: string;
	name: string;
	type: BeamType;
	quantity: number;

	// الأبعاد
	width: number;        // سم
	depth: number;        // سم
	length: number;       // م

	// الإعدادات
	cover: number;        // كفر (م)
	hookLength: number;   // طول الرجوع (م)

	// التسليح العلوي
	topBars: {
		count: number;
		diameter: number;
	};

	// التسليح السفلي
	bottomBars: {
		straight: { count: number; diameter: number };
		bent?: { count: number; diameter: number };
	};

	// الكانات
	stirrups: {
		diameter: number;
		spacing: number;   // سم
		legs: number;      // عدد الأرجل
	};
}

/**
 * نتيجة حساب الكمرة
 */
export interface BeamCalculation {
	// الخرسانة
	concreteVolume: number;

	// الحديد العلوي
	topBars: {
		diameter: number;
		barLength: number;
		barCount: number;
		totalBars: number;
		weight: number;
		stocksNeeded: number;
		wastePercentage: number;
	};

	// الحديد السفلي
	bottomBars: {
		straight: {
			diameter: number;
			barLength: number;
			barCount: number;
			totalBars: number;
			weight: number;
		};
		bent?: {
			diameter: number;
			barLength: number;
			barCount: number;
			totalBars: number;
			weight: number;
		};
	};

	// الكانات
	stirrups: {
		diameter: number;
		stirrupLength: number;
		countPerMeter: number;
		totalStirrups: number;
		totalLength: number;
		weight: number;
		stocksNeeded: number;
		wastePercentage: number;
	};

	// الإجماليات
	totals: {
		concreteVolume: number;
		topBarsWeight: number;
		bottomBarsWeight: number;
		stirrupsWeight: number;
		totalRebarWeight: number;
		wasteWeight: number;
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// الميدة (Ground Beam)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * بيانات الميدة
 */
export interface GroundBeamInput {
	id: string;
	name: string;         // م1، م2، م3...
	quantity: number;

	// الأبعاد
	dimensions: {
		length: number;     // الطول (م)
		width: number;      // العرض (م) - عادة 0.25 أو 0.30
		height: number;     // الارتفاع (م) - عادة 0.50 أو 0.60
	};

	// طريقة إدخال الطول
	lengthInput: {
		method: 'direct' | 'segments';
		segments?: number[];
		directLength?: number;
	};

	// الكفر
	cover: number;        // عادة 0.025 (2.5 سم)

	// طول الرجوع
	hookLength: number;   // عادة 0.40 (40 سم)

	// التسليح الرئيسي
	mainReinforcement: {
		top: {
			count: number;
			diameter: number;
		};
		bottom: {
			count: number;
			diameter: number;
		};
		middle?: {
			count: number;
			diameter: number;
		};
	};

	// الكانات
	stirrups: {
		diameter: number;
		countPerMeter: number;
		shape: 'rectangular' | 'diamond';
	};
}

/**
 * نتيجة حساب الميدة
 */
export interface GroundBeamCalculation {
	// الخرسانة
	concreteVolume: number;

	// الحديد الرئيسي
	mainBars: {
		position: 'top' | 'bottom' | 'middle';
		positionLabel: string;
		diameter: number;
		barLength: number;
		barCount: number;
		totalBars: number;
		totalLength: number;
		weight: number;
		stocksNeeded: number;
		wastePerStock: number;
		wastePercentage: number;
	}[];

	// الكانات
	stirrups: {
		diameter: number;
		stirrupLength: number;
		countPerMeter: number;
		totalStirrups: number;
		totalLength: number;
		weight: number;
		stocksNeeded: number;
		wastePercentage: number;
	};

	// الإجماليات
	totals: {
		concreteVolume: number;
		mainBarsWeight: number;
		stirrupsWeight: number;
		totalRebarWeight: number;
		wasteWeight: number;
	};
}

/**
 * إدخال التسليح السريع
 */
export interface QuickReinforcementInput {
	// صيغة: "4Φ16 + 2Φ14 / 4Φ16 / Φ8@15"
	// علوي / سفلي / كانات
	quickInput: string;
	parsed?: {
		top: { count: number; diameter: number }[];
		bottom: { count: number; diameter: number }[];
		stirrups: { diameter: number; spacing: number };
	};
}
