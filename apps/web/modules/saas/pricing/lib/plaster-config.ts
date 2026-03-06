export const PLASTER_METHODS = {
	buoj_awtar: {
		ar: "بؤج وأوتار",
		en: "Plaster Points & Guides",
		defaultThickness: 20,
		wastagePercent: 10,
	},
	buoj_awtar_flexible: {
		ar: "بؤج وأوتار + زاوية فليكسبل (تربيع)",
		en: "Points & Guides + Flexible Angle (Squaring)",
		defaultThickness: 20,
		wastagePercent: 12,
	},
	qadda_mizan: {
		ar: "قدّة وميزان",
		en: "Straightedge & Level",
		defaultThickness: 20,
		wastagePercent: 10,
	},
	machine: {
		ar: "لياسة ماكينة (رش)",
		en: "Machine Plaster (Spray)",
		defaultThickness: 12,
		wastagePercent: 8,
	},
} as const;

export type PlasterMethodKey = keyof typeof PLASTER_METHODS;

export const MIX_RATIOS = {
	"1:4": { cement: 1, sand: 4, label_ar: "1:4 (قوية)", label_en: "1:4 (Strong)" },
	"1:5": { cement: 1, sand: 5, label_ar: "1:5 (متوسطة)", label_en: "1:5 (Medium)" },
	"1:6": { cement: 1, sand: 6, label_ar: "1:6 (عادية — داخلية)", label_en: "1:6 (Standard — Internal)" },
} as const;

export type MixRatioKey = keyof typeof MIX_RATIOS;

export const PLASTER_FLOORS = [
	{ id: "basement", ar: "البدروم", en: "Basement" },
	{ id: "ground", ar: "الأرضي", en: "Ground Floor" },
	{ id: "first", ar: "الأول", en: "First Floor" },
	{ id: "mezzanine", ar: "الميزانين", en: "Mezzanine" },
	{ id: "second", ar: "الثاني", en: "Second Floor" },
	{ id: "third", ar: "الثالث", en: "Third Floor" },
	{ id: "repeated", ar: "المتكرر", en: "Repeated Floor" },
	{ id: "annex", ar: "الملحق", en: "Annex" },
] as const;

export function calculatePlasterMaterials(params: {
	totalArea: number;
	thickness: number;
	mixRatio: MixRatioKey;
}) {
	const thicknessM = params.thickness / 1000;
	const ratio = MIX_RATIOS[params.mixRatio];
	const totalParts = ratio.cement + ratio.sand;
	const dryVolumeFactor = 1.35;

	const wetVolume = params.totalArea * thicknessM;
	const dryVolume = wetVolume * dryVolumeFactor;

	const cementVolume = dryVolume * (ratio.cement / totalParts);
	const cementKg = cementVolume * 1440;
	const cementBags = Math.ceil(cementKg / 50);

	const sandVolume = dryVolume * (ratio.sand / totalParts);
	const sandVolumeRounded = Math.ceil(sandVolume * 10) / 10;

	const bondcreteLiters = Math.ceil(params.totalArea * 0.1);
	const meshLinearM = Math.ceil(params.totalArea * 0.2);

	return {
		cementBags,
		cementKg: Math.ceil(cementKg),
		sandVolumeM3: sandVolumeRounded,
		bondcreteLiters,
		meshLinearM,
		wetVolume: Math.round(wetVolume * 1000) / 1000,
		dryVolume: Math.round(dryVolume * 1000) / 1000,
	};
}
