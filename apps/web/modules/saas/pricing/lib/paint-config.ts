export type PaintCategory = "interior" | "facade" | "boundary";

export const PAINT_TYPES = {
	plastic_latex: {
		ar: "دهان بلاستيك (لاتكس)",
		en: "Latex / Plastic Paint",
		defaultCoats: 3,
		defaultCoverageRate: 11,
		applicableCategories: ["interior"] as PaintCategory[],
	},
	acrylic_exterior: {
		ar: "دهان أكريليك خارجي",
		en: "Acrylic Exterior Paint",
		defaultCoats: 2,
		defaultCoverageRate: 9,
		applicableCategories: ["interior", "facade", "boundary"] as PaintCategory[],
	},
	oil_enamel: {
		ar: "دهان زيتي (إنامل)",
		en: "Oil / Enamel Paint",
		defaultCoats: 2,
		defaultCoverageRate: 13,
		applicableCategories: ["interior"] as PaintCategory[],
	},
	epoxy: {
		ar: "دهان إيبوكسي",
		en: "Epoxy Paint",
		defaultCoats: 2,
		defaultCoverageRate: 9,
		applicableCategories: ["interior"] as PaintCategory[],
	},
	graviato: {
		ar: "جرافياتو",
		en: "Graviato",
		defaultCoats: 1,
		defaultCoverageRate: 3.5,
		applicableCategories: ["facade", "boundary"] as PaintCategory[],
	},
	elastomeric: {
		ar: "دهان مطاطي (إلاستوميريك)",
		en: "Elastomeric Paint",
		defaultCoats: 2,
		defaultCoverageRate: 7,
		applicableCategories: ["facade"] as PaintCategory[],
	},
	other: {
		ar: "أخرى",
		en: "Other",
		defaultCoats: 2,
		defaultCoverageRate: 10,
		applicableCategories: ["interior", "facade", "boundary"] as PaintCategory[],
	},
} as const;

export type PaintTypeKey = keyof typeof PAINT_TYPES;

export const PAINT_BRANDS = {
	jotun: { ar: "جوتن", en: "Jotun" },
	jazeera: { ar: "الجزيرة", en: "Jazeera" },
	hempel: { ar: "هيمبل", en: "Hempel" },
	national: { ar: "ناشونال", en: "National" },
	caparol: { ar: "كابارول", en: "Caparol" },
	sigma: { ar: "سيجما", en: "Sigma" },
	other: { ar: "أخرى", en: "Other" },
} as const;

export type PaintBrandKey = keyof typeof PAINT_BRANDS;

export const PUTTY_TYPES = {
	saveto_vetonit: {
		ar: "سافيتو فيتونيت (25 كجم)",
		en: "Saveto Vetonit (25kg)",
		packageKg: 25,
		defaultCoverageRate: 1.75,
	},
	saveto_vetonit_wr: {
		ar: "سافيتو فيتونيت WR (25 كجم)",
		en: "Saveto Vetonit WR (25kg)",
		packageKg: 25,
		defaultCoverageRate: 1.75,
	},
	saveto_fine: {
		ar: "سافيتو فاين (20 كجم)",
		en: "Saveto Fine (20kg)",
		packageKg: 20,
		defaultCoverageRate: 2.5,
	},
	jotun_putty: {
		ar: "معجون جوتن",
		en: "Jotun Putty",
		packageKg: 25,
		defaultCoverageRate: 2.0,
	},
	jazeera_putty: {
		ar: "معجون الجزيرة",
		en: "Jazeera Putty",
		packageKg: 25,
		defaultCoverageRate: 2.0,
	},
	other: {
		ar: "أخرى",
		en: "Other",
		packageKg: 25,
		defaultCoverageRate: 2.0,
	},
} as const;

export type PuttyTypeKey = keyof typeof PUTTY_TYPES;

export function getPaintTypesForCategory(category: PaintCategory) {
	return Object.entries(PAINT_TYPES).filter(([_, val]) =>
		val.applicableCategories.includes(category),
	) as [PaintTypeKey, (typeof PAINT_TYPES)[PaintTypeKey]][];
}

export function calculatePaintMaterials(params: {
	totalArea: number;
	paintType: PaintTypeKey;
	coats: number;
	paintCoverageRate: number;
	primerCoats: number;
	primerCoverageRate: number;
	puttyCoats: number;
	puttyCoverageRate: number;
	puttyType: PuttyTypeKey;
}) {
	// Paint
	const paintLiters = Math.ceil(
		(params.totalArea * params.coats) / params.paintCoverageRate,
	);
	const paintDrums18L = Math.ceil(paintLiters / 18);

	// Primer
	const primerLiters =
		params.primerCoats > 0
			? Math.ceil(
					(params.totalArea * params.primerCoats) / params.primerCoverageRate,
				)
			: 0;
	const primerDrums18L = primerLiters > 0 ? Math.ceil(primerLiters / 18) : 0;

	// Putty
	const puttyKg =
		params.puttyCoats > 0
			? Math.ceil(
					(params.totalArea * params.puttyCoats) / params.puttyCoverageRate,
				)
			: 0;
	const puttyPackages =
		puttyKg > 0
			? Math.ceil(puttyKg / PUTTY_TYPES[params.puttyType].packageKg)
			: 0;

	return {
		paintLiters,
		paintDrums18L,
		primerLiters,
		primerDrums18L,
		puttyKg,
		puttyPackages,
	};
}
