// ═══════════════════════════════════════════════════════════════
// أسعار اللياسة والمحارة
// ═══════════════════════════════════════════════════════════════
export const PLASTERING_PRICES = {
	internal: {
		economic: { material: 15, labor: 25, total: 40 },
		medium: { material: 20, labor: 30, total: 50 },
		luxury: { material: 30, labor: 40, total: 70 },
	},
	external: {
		economic: { material: 25, labor: 40, total: 65 },
		medium: { material: 35, labor: 50, total: 85 },
		luxury: { material: 50, labor: 65, total: 115 },
	},
	ceiling: {
		economic: { material: 18, labor: 30, total: 48 },
		medium: { material: 25, labor: 35, total: 60 },
		luxury: { material: 35, labor: 45, total: 80 },
	},
	putty: { material: 8, labor: 12, total: 20 },
};

// ═══════════════════════════════════════════════════════════════
// أسعار الدهانات
// ═══════════════════════════════════════════════════════════════
export const PAINTING_PRICES = {
	internal: {
		economic: { material: 8, labor: 12, total: 20 },
		medium: { material: 15, labor: 18, total: 33 },
		luxury: { material: 25, labor: 25, total: 50 },
	},
	external: {
		economic: { material: 15, labor: 20, total: 35 },
		medium: { material: 22, labor: 28, total: 50 },
		luxury: { material: 35, labor: 35, total: 70 },
	},
};

// ═══════════════════════════════════════════════════════════════
// أسعار الأرضيات
// ═══════════════════════════════════════════════════════════════
export const FLOORING_PRICES = {
	ceramic: {
		economic: { material: 45, labor: 45, total: 90 },
		medium: { material: 85, labor: 50, total: 135 },
		luxury: { material: 150, labor: 55, total: 205 },
	},
	porcelain: {
		economic: { material: 80, labor: 50, total: 130 },
		medium: { material: 120, labor: 55, total: 175 },
		luxury: { material: 200, labor: 60, total: 260 },
	},
	marble: {
		economic: { material: 180, labor: 70, total: 250 },
		medium: { material: 280, labor: 80, total: 360 },
		luxury: { material: 450, labor: 100, total: 550 },
	},
	granite: {
		economic: { material: 200, labor: 75, total: 275 },
		medium: { material: 320, labor: 85, total: 405 },
		luxury: { material: 500, labor: 110, total: 610 },
	},
	parquet: {
		economic: { material: 100, labor: 45, total: 145 },
		medium: { material: 180, labor: 55, total: 235 },
		luxury: { material: 300, labor: 70, total: 370 },
	},
	vinyl: {
		economic: { material: 35, labor: 25, total: 60 },
		medium: { material: 65, labor: 30, total: 95 },
		luxury: { material: 120, labor: 40, total: 160 },
	},
	// مواد إضافية
	adhesive: 8,
	grout: 3,
	skirting: 25,
};

// ═══════════════════════════════════════════════════════════════
// أسعار الأعمال الكهربائية
// ═══════════════════════════════════════════════════════════════
export const ELECTRICAL_PRICES = {
	points: {
		lighting: 120,
		outlets: 100,
		acSplit: 350,
		waterHeater: 500,
		doorbell: 200,
		tvInternet: 150,
		intercom: 300,
		phone: 100,
	},
	panels: {
		main: {
			24: 2500,
			36: 3500,
			48: 4500,
		},
		sub: 800,
		meterSetup: 2000,
		grounding: 1500,
	},
};

// ═══════════════════════════════════════════════════════════════
// أسعار أعمال السباكة
// ═══════════════════════════════════════════════════════════════
export const PLUMBING_PRICES = {
	points: {
		waterSupply: 150,
		drainage: 200,
		toilet: 450,
		sink: 250,
		shower: 350,
		bathtub: 500,
		kitchen: 400,
		waterHeater: 300,
	},
	tanks: {
		ground: 2500,
		roof: 1500,
		pump: 1200,
	},
};

// ═══════════════════════════════════════════════════════════════
// أسعار التكييف
// ═══════════════════════════════════════════════════════════════
export const HVAC_PRICES = {
	split: {
		supply: {
			"1.5ton": 2200,
			"2ton": 2800,
			"2.5ton": 3200,
		},
		installation: {
			"1.5ton": 450,
			"2ton": 500,
			"2.5ton": 550,
		},
	},
	ducted: {
		supply: 3500,
		installation: 800,
		ductwork: 150,
	},
	concealed: {
		supply: 4000,
		installation: 600,
	},
};

// ═══════════════════════════════════════════════════════════════
// أسعار الأبواب والنوافذ
// ═══════════════════════════════════════════════════════════════
export const DOORS_WINDOWS_PRICES = {
	doors: {
		internal: {
			economic: 600,
			medium: 1200,
			luxury: 2500,
		},
		external: {
			economic: 1500,
			medium: 3000,
			luxury: 6000,
		},
		garage: {
			economic: 3000,
			medium: 5000,
			luxury: 8000,
		},
	},
	windows: {
		aluminum: {
			economic: 350,
			medium: 500,
			luxury: 750,
		},
	},
};

// ═══════════════════════════════════════════════════════════════
// أسعار المواد الإنشائية
// ═══════════════════════════════════════════════════════════════
export const STRUCTURAL_PRICES = {
	concrete: {
		C20: 250,
		C25: 280,
		C30: 310,
		C35: 350,
		C40: 400,
	} as Record<string, number>,
	steel: 3200, // SAR per ton
	steelPerKg: 3.2, // SAR per kg
	formwork: 45, // SAR per m2
	blocks: {
		10: 2.5,
		15: 3.5,
		20: 4.5,
	} as Record<number, number>,
};

// ═══════════════════════════════════════════════════════════════
// أسعار العمالة للأعمال الإنشائية
// ═══════════════════════════════════════════════════════════════
export const STRUCTURAL_LABOR_PRICES = {
	foundations: 180, // SAR per m³
	columns: 220, // SAR per m³
	beams: 200, // SAR per m³
	slabs: 150, // SAR per m³
	blocks: 35, // SAR per m²
	stairs: 250, // SAR per m³
	neckColumns: 200, // SAR per m³
	groundBeams: 180, // SAR per m³
	plainConcrete: 100, // SAR per m³
};

// ═══════════════════════════════════════════════════════════════
// جدول أوزان حديد التسليح لكل متر طولي (كجم/م)
// ═══════════════════════════════════════════════════════════════
export const REBAR_WEIGHTS: Record<number, number> = {
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
};

// ═══════════════════════════════════════════════════════════════
// أطوال أسياخ المصنع (السوق السعودي)
// ═══════════════════════════════════════════════════════════════
export const STOCK_LENGTHS: Record<number, number> = {
	6: 12,
	8: 6,    // 8 مم يأتي بطول 6 متر فقط
	10: 12,
	12: 12,
	14: 12,
	16: 12,
	18: 12,
	20: 12,
	22: 12,
	25: 12,
	28: 12,
	32: 12,
};

// ═══════════════════════════════════════════════════════════════
// أقطار الحديد المتاحة
// ═══════════════════════════════════════════════════════════════
export const REBAR_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32];

// ═══════════════════════════════════════════════════════════════
// أنواع الخرسانة المتاحة
// ═══════════════════════════════════════════════════════════════
export const CONCRETE_TYPES = ["C20", "C25", "C30", "C35", "C40"];

// ═══════════════════════════════════════════════════════════════
// أسعار الخرسانة (اختصار للوصول المباشر)
// ═══════════════════════════════════════════════════════════════
export const CONCRETE_PRICES: Record<string, number> = {
	C15: 220,
	C20: 250,
	C25: 280,
	C30: 310,
	C35: 350,
	C40: 400,
};
