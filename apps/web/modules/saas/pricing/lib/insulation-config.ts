export const WATERPROOFING_MATERIALS = {
	bitumen_rolls: {
		ar: "لفائف بيتومينية (ممبرين)",
		en: "Bitumen Membrane Rolls",
		defaultThickness: 4,
		wastagePercent: 15,
		overlapPercent: 10,
	},
	liquid_bitumen: {
		ar: "بيتومين سائل (برايمر/أساس)",
		en: "Liquid Bitumen (Primer)",
		defaultThickness: 1,
		wastagePercent: 5,
		overlapPercent: 0,
	},
	cement_based: {
		ar: "عزل أسمنتي (سيكا/فلاجفلكس)",
		en: "Cement-based Waterproofing",
		defaultThickness: 2,
		wastagePercent: 10,
		overlapPercent: 0,
	},
	polyurethane: {
		ar: "بولي يوريثان سائل",
		en: "Liquid Polyurethane",
		defaultThickness: 2,
		wastagePercent: 8,
		overlapPercent: 0,
	},
	epoxy: {
		ar: "إيبوكسي مقاوم للماء",
		en: "Waterproof Epoxy",
		defaultThickness: 1.5,
		wastagePercent: 10,
		overlapPercent: 0,
	},
	pvc_membrane: {
		ar: "أغشية PVC/TPO",
		en: "PVC/TPO Membrane",
		defaultThickness: 1.5,
		wastagePercent: 12,
		overlapPercent: 15,
	},
	other: {
		ar: "أخرى",
		en: "Other",
		defaultThickness: 0,
		wastagePercent: 10,
		overlapPercent: 0,
	},
} as const;

export const WATERPROOFING_LOCATIONS = [
	{ id: "roof", ar: "السطح", en: "Roof" },
	{ id: "basement", ar: "البدروم/القبو", en: "Basement" },
	{ id: "bathroom", ar: "دورات المياه", en: "Bathrooms" },
	{ id: "kitchen", ar: "المطبخ", en: "Kitchen" },
	{ id: "tank", ar: "الخزانات", en: "Tanks" },
	{ id: "pool", ar: "المسبح/البركة", en: "Pool" },
	{ id: "balcony", ar: "الشرفة/البلكونة", en: "Balcony" },
] as const;

export type WaterproofingMaterialKey = keyof typeof WATERPROOFING_MATERIALS;

export function calculateWaterproofingQuantity(params: {
	area: number;
	materialKey: WaterproofingMaterialKey;
	layers: number;
	includesPrimer: boolean;
	wastagePercent: number;
}) {
	const mat = WATERPROOFING_MATERIALS[params.materialKey];
	const overlapArea = params.area * ((mat?.overlapPercent || 0) / 100);
	const effectiveArea = (params.area + overlapArea) * params.layers;
	const wastageArea = effectiveArea * (params.wastagePercent / 100);
	const finalQuantity = effectiveArea + wastageArea;
	const primerArea = params.includesPrimer ? params.area * 1.05 : 0;

	return {
		netArea: params.area,
		overlapArea,
		effectiveArea,
		wastageArea,
		finalQuantity,
		primerArea,
		wastagePercent: params.wastagePercent,
		overlapPercent: mat?.overlapPercent || 0,
	};
}

// ══════════════════════════════════════════════════════════════
// Thermal Insulation — SBC 602
// ══════════════════════════════════════════════════════════════

export const THERMAL_INSULATION_MATERIALS = {
	xps: {
		ar: "بوليسترين مبثوق (XPS)",
		en: "Extruded Polystyrene (XPS)",
		lambda: 0.034,
		defaultThickness: 50,
		wastagePercent: 8,
	},
	eps: {
		ar: "بوليسترين ممدد (EPS)",
		en: "Expanded Polystyrene (EPS)",
		lambda: 0.038,
		defaultThickness: 50,
		wastagePercent: 10,
	},
	rock_wool: {
		ar: "صوف صخري",
		en: "Rock Wool",
		lambda: 0.040,
		defaultThickness: 50,
		wastagePercent: 5,
	},
	pu_spray: {
		ar: "فوم بولي يوريثان (رش)",
		en: "Polyurethane Spray Foam",
		lambda: 0.024,
		defaultThickness: 30,
		wastagePercent: 3,
	},
	glass_wool: {
		ar: "ألياف زجاجية",
		en: "Glass Wool",
		lambda: 0.044,
		defaultThickness: 50,
		wastagePercent: 5,
	},
	pir: {
		ar: "بولي أيزوسيانورات (PIR)",
		en: "Polyisocyanurate (PIR)",
		lambda: 0.022,
		defaultThickness: 40,
		wastagePercent: 8,
	},
	other: {
		ar: "أخرى",
		en: "Other",
		lambda: 0,
		defaultThickness: 0,
		wastagePercent: 10,
	},
} as const;

export const THERMAL_INSULATION_LOCATIONS = [
	{ id: "roof", ar: "السطح", en: "Roof" },
	{ id: "ext_walls", ar: "الجدران الخارجية", en: "Exterior Walls" },
	{ id: "basement_walls", ar: "جدران البدروم", en: "Basement Walls" },
	{ id: "floor", ar: "الأرضيات", en: "Floors" },
] as const;

export type ThermalMaterialKey = keyof typeof THERMAL_INSULATION_MATERIALS;

export function calculateThermalQuantity(params: {
	grossArea: number;
	deductions: number;
	materialKey: ThermalMaterialKey;
	thickness: number;
	wastagePercent: number;
}) {
	const mat = THERMAL_INSULATION_MATERIALS[params.materialKey];
	const netArea = Math.max(0, params.grossArea - params.deductions);
	const wastagePercent = params.wastagePercent;
	const wastageArea = netArea * (wastagePercent / 100);
	const finalQuantity = netArea + wastageArea;
	const volumeM3 = finalQuantity * (params.thickness / 1000);
	const lambda = mat?.lambda || 0;
	const rValue = params.thickness > 0 && lambda > 0 ? (params.thickness / 1000) / lambda : 0;

	return {
		grossArea: params.grossArea,
		deductions: params.deductions,
		netArea,
		wastagePercent,
		wastageArea,
		finalQuantity,
		volumeM3,
		lambda,
		rValue,
	};
}
