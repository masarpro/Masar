// ═══════════════════════════════════════════════════════════════════════════
// ثوابت الأسقف - Slabs Constants
// ═══════════════════════════════════════════════════════════════════════════

import type { SlabType } from '../types/slabs';

// أنواع الأسقف
export const SLAB_TYPES = {
	SOLID: 'solid',
	FLAT: 'flat',
	RIBBED: 'ribbed',
	HOLLOW_CORE: 'hollow_core',
	BANDED_BEAM: 'banded_beam',
} as const;

// معلومات عرض أنواع الأسقف
export const SLAB_TYPE_INFO: Record<SlabType, {
	nameAr: string;
	nameEn: string;
	description: string;
	icon: string;
	color: string;
}> = {
	solid: {
		nameAr: 'سقف صلب',
		nameEn: 'Solid Slab',
		description: 'سقف خرساني مصمت - اتجاه واحد أو اتجاهين',
		icon: '▬',
		color: 'blue',
	},
	flat: {
		nameAr: 'سقف مسطح (فلات)',
		nameEn: 'Flat Slab',
		description: 'سقف مسطح بدون كمرات - مع/بدون تكثيف',
		icon: '▭',
		color: 'purple',
	},
	ribbed: {
		nameAr: 'سقف هوردي',
		nameEn: 'Ribbed/Hordi Slab',
		description: 'أعصاب خرسانية مع بلوك هوردي وطبقة علوية',
		icon: '▤',
		color: 'orange',
	},
	hollow_core: {
		nameAr: 'سقف هولوكور',
		nameEn: 'Hollow-core Panels',
		description: 'ألواح مسبقة الصب مجوفة',
		icon: '▦',
		color: 'green',
	},
	banded_beam: {
		nameAr: 'سقف كمرات عريضة',
		nameEn: 'Banded Beam Slab',
		description: 'سقف مع كمرات مخفية/عريضة',
		icon: '▦',
		color: 'indigo',
	},
};

// مقاسات بلوك الهوردي الشائعة (سم)
export const HORDI_BLOCK_SIZES = [
	{ width: 40, length: 20, height: 20, nameAr: '40×20×20' },
	{ width: 40, length: 25, height: 25, nameAr: '40×25×25' },
	{ width: 40, length: 20, height: 25, nameAr: '40×20×25' },
	{ width: 40, length: 27, height: 27, nameAr: '40×27×27' },
];

// عروض ألواح الهولوكور الشائعة (م)
export const HOLLOW_CORE_WIDTHS = [1.2, 1.0, 0.6];

// التباعدات الشائعة للتسليح (سم)
export const COMMON_SPACINGS = [10, 12.5, 15, 17.5, 20, 22.5, 25, 30];

// السماكات الشائعة للأسقف (سم)
export const COMMON_THICKNESSES = {
	solid: [12, 14, 15, 16, 18, 20, 22, 25, 28, 30, 32, 35, 40, 45],
	flat: [18, 20, 22, 25, 28, 30],
	ribbed_topping: [5, 6, 7, 8],
	ribbed_rib_depth: [20, 25, 27, 30],
	hollow_core: [12, 15, 20, 25, 26.5, 32, 40],
	topping: [5, 6, 7, 8, 10],
};

// معاملات الحديد التقديرية (كجم/م³)
export const REBAR_RATIOS = {
	solid_one_way: { min: 80, typical: 100, max: 130 },
	solid_two_way: { min: 90, typical: 120, max: 150 },
	flat_slab: { min: 100, typical: 140, max: 180 },
	ribbed: { min: 70, typical: 90, max: 120 },
	hollow_core_topping: { min: 30, typical: 50, max: 70 },
};

// أسماء الأدوار
export const SLAB_FLOOR_NAMES = ['أرضي', 'أول', 'ثاني', 'ثالث', 'رابع', 'متكرر', 'أخير'];

// قوالب التسليح الجاهزة للكمرات
export interface BeamReinforcementTemplate {
	id: string;
	name: string;
	top: { count: number; diameter: number };
	bottom: {
		straight: { count: number; diameter: number };
		bent?: { count: number; diameter: number };
	};
	stirrups: { diameter: number; spacing: number; legs: number };
}

export const BEAM_REINFORCEMENT_TEMPLATES: BeamReinforcementTemplate[] = [
	{
		id: 'template-1',
		name: 'ص 1',
		top: { count: 2, diameter: 12 },
		bottom: {
			straight: { count: 2, diameter: 12 },
		},
		stirrups: { diameter: 6, spacing: 0.125, legs: 2 },
	},
	{
		id: 'template-2',
		name: 'ص 2',
		top: { count: 2, diameter: 14 },
		bottom: {
			straight: { count: 2, diameter: 14 },
		},
		stirrups: { diameter: 6, spacing: 0.125, legs: 2 },
	},
	{
		id: 'template-3',
		name: 'ص 3',
		top: { count: 3, diameter: 14 },
		bottom: {
			straight: { count: 3, diameter: 14 },
		},
		stirrups: { diameter: 7, spacing: 0.125, legs: 2 },
	},
	{
		id: 'template-4',
		name: 'ص 4',
		top: { count: 3, diameter: 16 },
		bottom: {
			straight: { count: 3, diameter: 16 },
			bent: { count: 2, diameter: 14 },
		},
		stirrups: { diameter: 8, spacing: 0.125, legs: 2 },
	},
];

// القيم الافتراضية
export const SLAB_DEFAULTS = {
	cover: 0.025,           // 2.5 سم
	lapLengthFactor: 40,    // 40 × القطر
	hookLength: 0.10,       // 10 سم
	stirrupHook: 0.10,      // 10 سم
	formworkWaste: 0.05,    // 5% هالك شدات
	concreteWaste: 0.025,   // 2.5% هالك خرسانة
	blockWaste: 0.03,       // 3% هالك بلوك
};
