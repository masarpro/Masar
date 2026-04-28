import type { CatalogEntry } from "../types";

// أعمال الدهانات — أسعار السوق السعودي (ر.س/م² ما لم يُذكر غير ذلك)
// المصادر: متوسطات تنفيذ Jotun/SCIB/Caparol في الرياض/جدة 2026

export const PAINT_CATALOG: CatalogEntry[] = [
	{
		itemKey: "finishing.paint.interior",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "interior",

		nameAr: "دهان داخلي",
		nameEn: "Interior Paint",
		descriptionAr: "دهان جدران الغرف والممرات الداخلية مع المعجون والأوجه",
		descriptionEn: "Interior wall paint with putty + topcoats",

		icon: "Paintbrush",
		color: "#3B82F6",

		unit: "m²",
		defaultWastagePercent: 10,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: {
				key: "area",
				label: "مساحة الدهان",
				unit: "m²",
				defaultSuggestion: "linkFrom:finishing.plaster.interior",
				min: 0,
			},
		},

		defaultMaterialUnitPrice: 18,
		defaultLaborUnitPrice: 7,

		commonMaterials: [
			{ nameAr: "جوتن ملكي فاخر", nameEn: "Jotun Royale Premium", brand: "Jotun", grade: "فاخر", suggestedPrice: 25, source: "imported" },
			{ nameAr: "جوتن ريجال", nameEn: "Jotun Regal", brand: "Jotun", grade: "عادي", suggestedPrice: 18, source: "imported" },
			{ nameAr: "SCIB Super", nameEn: "SCIB Super", brand: "SCIB", grade: "عادي", suggestedPrice: 15, source: "local" },
			{ nameAr: "Caparol Premium", nameEn: "Caparol Premium", brand: "Caparol", grade: "فاخر", suggestedPrice: 28, source: "imported" },
			{ nameAr: "ناشيونال بنت", nameEn: "National Paint", brand: "National", grade: "اقتصادي", suggestedPrice: 12, source: "local" },
			{ nameAr: "Sigma Glanzlack", nameEn: "Sigma Glanzlack", brand: "Sigma", grade: "فاخر", suggestedPrice: 26, source: "imported" },
		],

		commonColors: [
			{ nameAr: "أبيض", nameEn: "White", hexValue: "#FFFFFF" },
			{ nameAr: "بيج فاتح", nameEn: "Light Beige", hexValue: "#F5F5DC" },
			{ nameAr: "رمادي فاتح", nameEn: "Light Gray", hexValue: "#D3D3D3" },
			{ nameAr: "أوف وايت", nameEn: "Off White", hexValue: "#FAF9F6" },
			{ nameAr: "أزرق ثلجي", nameEn: "Ice Blue", hexValue: "#E0F2FE" },
		],

		linkableFrom: ["finishing.plaster.interior"],
		legacyDerivationType: "direct_area",
		legacyScope: "per_floor",
		displayOrder: 200,
	},
	{
		itemKey: "finishing.paint.exterior",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "exterior",

		nameAr: "دهان خارجي",
		nameEn: "Exterior Paint",
		descriptionAr: "دهان الواجهات الخارجية المقاوم للعوامل الجوية",
		descriptionEn: "Weather-resistant exterior facade paint",

		icon: "Paintbrush",
		color: "#0EA5E9",

		unit: "m²",
		defaultWastagePercent: 12,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: {
				key: "area",
				label: "مساحة الدهان الخارجي",
				unit: "m²",
				defaultSuggestion: "linkFrom:finishing.plaster.exterior",
				min: 0,
			},
		},

		defaultMaterialUnitPrice: 28,
		defaultLaborUnitPrice: 10,

		commonMaterials: [
			{ nameAr: "جوتن جوتاشيلد", nameEn: "Jotun Jotashield", brand: "Jotun", grade: "فاخر", suggestedPrice: 45, source: "imported" },
			{ nameAr: "Caparol Amphibolin", nameEn: "Caparol Amphibolin", brand: "Caparol", grade: "فاخر", suggestedPrice: 50, source: "imported" },
			{ nameAr: "SCIB Weathercoat", nameEn: "SCIB Weathercoat", brand: "SCIB", grade: "عادي", suggestedPrice: 30, source: "local" },
			{ nameAr: "ناشيونال خارجي", nameEn: "National Exterior", brand: "National", grade: "اقتصادي", suggestedPrice: 22, source: "local" },
			{ nameAr: "Sigma Coatings Exterior", nameEn: "Sigma Exterior", brand: "Sigma", grade: "فاخر", suggestedPrice: 42, source: "imported" },
		],

		commonColors: [
			{ nameAr: "أبيض ناصع", nameEn: "Bright White", hexValue: "#FFFFFF" },
			{ nameAr: "بيج رملي", nameEn: "Sandy Beige", hexValue: "#E8C9A0" },
			{ nameAr: "بُني فاتح", nameEn: "Light Brown", hexValue: "#A8835A" },
			{ nameAr: "رمادي حجري", nameEn: "Stone Gray", hexValue: "#9CA3AF" },
		],

		linkableFrom: ["finishing.plaster.exterior"],
		legacyDerivationType: "direct_area",
		legacyScope: "external",
		displayOrder: 210,
	},
	{
		itemKey: "finishing.paint.decorative",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "decorative",

		nameAr: "دهانات ديكورية",
		nameEn: "Decorative Paint",
		descriptionAr: "دهانات بتأثيرات (ميتاليك، ستوكو، خرساني، رخامي)",
		descriptionEn: "Effect paints (metallic, stucco, concrete, marble)",

		icon: "Sparkles",
		color: "#A855F7",

		unit: "m²",
		defaultWastagePercent: 15,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: { key: "area", label: "مساحة الدهان الديكوري", unit: "m²", min: 0 },
		},

		defaultMaterialUnitPrice: 65,
		defaultLaborUnitPrice: 35,

		commonMaterials: [
			{ nameAr: "Jotun Lady Effects ميتاليك", nameEn: "Jotun Lady Effects Metallic", brand: "Jotun", grade: "فاخر", suggestedPrice: 95, source: "imported" },
			{ nameAr: "ستوكو فينيسي", nameEn: "Venetian Stucco", grade: "فاخر", suggestedPrice: 80, source: "imported" },
			{ nameAr: "Caparol Capadecor", nameEn: "Caparol Capadecor", brand: "Caparol", grade: "فاخر", suggestedPrice: 85, source: "imported" },
			{ nameAr: "ميكروسيمنت", nameEn: "Microcement", grade: "فاخر", suggestedPrice: 120, source: "imported" },
		],

		legacyDerivationType: "direct_area",
		legacyScope: "per_floor",
		displayOrder: 220,
	},
	{
		itemKey: "finishing.paint.wood",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "wood",

		nameAr: "دهان أخشاب",
		nameEn: "Wood Paint / Lacquer",
		descriptionAr: "دهان لاكيه أو شفاف للأبواب والإطارات الخشبية",
		descriptionEn: "Lacquer or clear coat for wooden doors and frames",

		icon: "TreePine",
		color: "#92400E",

		unit: "m²",
		defaultWastagePercent: 12,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: { key: "area", label: "مساحة الأسطح الخشبية", unit: "m²", min: 0 },
		},

		defaultMaterialUnitPrice: 35,
		defaultLaborUnitPrice: 25,

		commonMaterials: [
			{ nameAr: "Jotun Demidekk شفاف", nameEn: "Jotun Demidekk Clear", brand: "Jotun", grade: "فاخر", suggestedPrice: 60, source: "imported" },
			{ nameAr: "لاكيه دوكو", nameEn: "Duco Lacquer", grade: "عادي", suggestedPrice: 32, source: "local" },
			{ nameAr: "Sayerlack", nameEn: "Sayerlack PU", brand: "Sayerlack", grade: "فاخر", suggestedPrice: 70, source: "imported" },
		],

		legacyDerivationType: "direct_area",
		legacyScope: "per_floor",
		displayOrder: 230,
	},
	{
		itemKey: "finishing.paint.metal",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "metal",

		nameAr: "دهان معادن (إيبوكسي/بوية حديد)",
		nameEn: "Metal Paint (Epoxy / Anti-Rust)",
		descriptionAr: "دهان مضاد للصدأ للأسطح المعدنية والشدات والأبواب",
		descriptionEn: "Anti-rust paint for metal surfaces, gates, and frames",

		icon: "Wrench",
		color: "#475569",

		unit: "m²",
		defaultWastagePercent: 10,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: { key: "area", label: "مساحة الأسطح المعدنية", unit: "m²", min: 0 },
		},

		defaultMaterialUnitPrice: 30,
		defaultLaborUnitPrice: 18,

		commonMaterials: [
			{ nameAr: "Jotun Penguard إيبوكسي", nameEn: "Jotun Penguard Epoxy", brand: "Jotun", grade: "فاخر", suggestedPrice: 55, source: "imported" },
			{ nameAr: "Hempel Hempadur", nameEn: "Hempel Hempadur", brand: "Hempel", grade: "فاخر", suggestedPrice: 60, source: "imported" },
			{ nameAr: "بوية حديد محلية", nameEn: "Local Anti-Rust", grade: "عادي", suggestedPrice: 25, source: "local" },
		],

		legacyDerivationType: "direct_area",
		legacyScope: "per_floor",
		displayOrder: 240,
	},
	{
		itemKey: "finishing.paint.epoxy_floor",
		domain: "FINISHING",
		categoryKey: "paint",
		subcategoryKey: "epoxy_floor",

		nameAr: "دهان إيبوكسي للأرضيات",
		nameEn: "Epoxy Floor Coating",
		descriptionAr: "دهان إيبوكسي صناعي لأرضيات المستودعات والمواقف",
		descriptionEn: "Industrial epoxy floor coating for warehouses and parking",

		icon: "Layers",
		color: "#1E40AF",

		unit: "m²",
		defaultWastagePercent: 10,
		defaultCalculationMethod: "direct_area",
		requiredFields: {
			primary: { key: "area", label: "مساحة الأرضية", unit: "m²", defaultSuggestion: "fromContext.totalFloorArea", min: 0 },
		},

		defaultMaterialUnitPrice: 75,
		defaultLaborUnitPrice: 30,

		commonMaterials: [
			{ nameAr: "Jotun Jotafloor SL", nameEn: "Jotun Jotafloor SL", brand: "Jotun", grade: "فاخر", suggestedPrice: 130, source: "imported" },
			{ nameAr: "Sika Sikafloor", nameEn: "Sika Sikafloor", brand: "Sika", grade: "فاخر", suggestedPrice: 140, source: "imported" },
			{ nameAr: "إيبوكسي محلي", nameEn: "Local Epoxy", grade: "عادي", suggestedPrice: 70, source: "local" },
		],

		legacyDerivationType: "direct_area",
		legacyScope: "per_floor",
		displayOrder: 250,
	},
];
