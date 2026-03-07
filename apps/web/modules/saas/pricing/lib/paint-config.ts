export const PAINT_TYPES = {
	plastic_latex: {
		ar: "دهان بلاستيك (لاتكس)",
		en: "Latex / Plastic Paint",
		defaultCoats: 3,
		wastagePercent: 10,
		coverageM2PerLiter: 12,
	},
	acrylic: {
		ar: "دهان أكريليك",
		en: "Acrylic Paint",
		defaultCoats: 2,
		wastagePercent: 10,
		coverageM2PerLiter: 10,
	},
	velvet: {
		ar: "دهان مخملي",
		en: "Velvet Paint",
		defaultCoats: 2,
		wastagePercent: 12,
		coverageM2PerLiter: 8,
	},
	texture: {
		ar: "دهان تكستشر",
		en: "Texture Paint",
		defaultCoats: 2,
		wastagePercent: 15,
		coverageM2PerLiter: 4,
	},
	wood_varnish: {
		ar: "دهان/ورنيش أخشاب",
		en: "Wood Varnish",
		defaultCoats: 2,
		wastagePercent: 8,
		coverageM2PerLiter: 14,
	},
} as const;

export type PaintTypeKey = keyof typeof PAINT_TYPES;

export const PAINT_QUALITY_LEVELS = {
	economy: {
		ar: "اقتصادي (ناشونال/محلي)",
		en: "Economy",
		priceRange: "12–22 ر.س/م²",
	},
	standard: {
		ar: "عادي (جوتن فينيل مات / الجزيرة)",
		en: "Standard",
		priceRange: "22–38 ر.س/م²",
	},
	premium: {
		ar: "ممتاز (جوتن فينوماستيك)",
		en: "Premium",
		priceRange: "38–60 ر.س/م²",
	},
	luxury: {
		ar: "فاخر (بنجامين مور / فارو آند بول)",
		en: "Luxury",
		priceRange: "60–120 ر.س/م²",
	},
} as const;

export type PaintQualityKey = keyof typeof PAINT_QUALITY_LEVELS;

export function calculatePaintMaterials(params: {
	totalArea: number;
	paintType: PaintTypeKey;
	coats: number;
}) {
	const paint = PAINT_TYPES[params.paintType];
	const coverage = paint.coverageM2PerLiter;
	const totalPaintArea = params.totalArea * params.coats;
	const liters = Math.ceil(totalPaintArea / coverage);
	const gallons = Math.ceil(liters / 3.785);
	const drums18L = Math.ceil(liters / 18);

	// Primer: 1 coat, coverage ~14 m²/L
	const primerLiters = Math.ceil(params.totalArea / 14);

	// Putty/filler: ~0.5 kg/m² for 2 coats
	const puttyKg = Math.ceil(params.totalArea * 0.5);

	return {
		paintLiters: liters,
		paintGallons: gallons,
		paintDrums18L: drums18L,
		primerLiters,
		puttyKg,
		totalPaintArea: Math.round(totalPaintArea * 100) / 100,
	};
}
