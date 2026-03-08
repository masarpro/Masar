import type { MEPCategoryConfig, MEPCategoryId } from "../types/mep";

export const MEP_CATEGORIES: Record<MEPCategoryId, MEPCategoryConfig> = {
	ELECTRICAL: {
		id: "ELECTRICAL",
		nameAr: "الأعمال الكهربائية",
		nameEn: "Electrical Works",
		icon: "Zap",
		color: "#F59E0B", // amber
		subCategories: {
			lighting: {
				nameAr: "الإنارة",
				nameEn: "Lighting",
				defaultUnit: "نقطة",
				icon: "Lightbulb",
			},
			power_outlets: {
				nameAr: "نقاط القوى والأفياش",
				nameEn: "Power Outlets",
				defaultUnit: "نقطة",
				icon: "Plug",
			},
			cables: {
				nameAr: "الكيبلات والأسلاك",
				nameEn: "Cables & Wires",
				defaultUnit: "م.ط",
				icon: "Cable",
			},
			panels: {
				nameAr: "اللوحات الكهربائية",
				nameEn: "Distribution Panels",
				defaultUnit: "عدد",
				icon: "LayoutGrid",
			},
			earthing: {
				nameAr: "التأريض",
				nameEn: "Earthing System",
				defaultUnit: "نظام",
				icon: "Anchor",
			},
			emergency: {
				nameAr: "إنارة الطوارئ",
				nameEn: "Emergency Lighting",
				defaultUnit: "نقطة",
				icon: "AlertTriangle",
			},
		},
	},
	PLUMBING: {
		id: "PLUMBING",
		nameAr: "الأعمال الصحية",
		nameEn: "Plumbing Works",
		icon: "Droplets",
		color: "#3B82F6", // blue
		subCategories: {
			water_supply: {
				nameAr: "تغذية المياه",
				nameEn: "Water Supply",
				defaultUnit: "نقطة",
				icon: "Droplet",
			},
			drainage: {
				nameAr: "الصرف الصحي",
				nameEn: "Drainage",
				defaultUnit: "نقطة",
				icon: "ArrowDownCircle",
			},
			pipes: {
				nameAr: "المواسير",
				nameEn: "Pipes",
				defaultUnit: "م.ط",
				icon: "Minus",
			},
			tanks: {
				nameAr: "الخزانات",
				nameEn: "Water Tanks",
				defaultUnit: "م³",
				icon: "Box",
			},
			pumps: {
				nameAr: "المضخات",
				nameEn: "Pumps",
				defaultUnit: "عدد",
				icon: "Activity",
			},
			heaters: {
				nameAr: "السخانات",
				nameEn: "Water Heaters",
				defaultUnit: "عدد",
				icon: "Flame",
			},
			manholes: {
				nameAr: "غرف التفتيش",
				nameEn: "Manholes",
				defaultUnit: "عدد",
				icon: "Square",
			},
			fixtures: {
				nameAr: "الأجهزة الصحية",
				nameEn: "Sanitary Fixtures",
				defaultUnit: "عدد",
				icon: "Bath",
			},
		},
	},
	HVAC: {
		id: "HVAC",
		nameAr: "التكييف والتهوية",
		nameEn: "HVAC",
		icon: "Wind",
		color: "#06B6D4", // cyan
		subCategories: {
			ac_units: {
				nameAr: "وحدات التكييف",
				nameEn: "AC Units",
				defaultUnit: "وحدة",
				icon: "Snowflake",
			},
			refrigerant: {
				nameAr: "مواسير التبريد",
				nameEn: "Refrigerant Pipes",
				defaultUnit: "م.ط",
				icon: "Thermometer",
			},
			ductwork: {
				nameAr: "مجاري الهواء",
				nameEn: "Ductwork",
				defaultUnit: "م²",
				icon: "Wind",
			},
			diffusers: {
				nameAr: "مخارج الهواء",
				nameEn: "Diffusers",
				defaultUnit: "عدد",
				icon: "CircleDot",
			},
			ventilation: {
				nameAr: "التهوية والشفط",
				nameEn: "Ventilation",
				defaultUnit: "عدد",
				icon: "Fan",
			},
			condensate: {
				nameAr: "تصريف المكثفات",
				nameEn: "Condensate Drain",
				defaultUnit: "م.ط",
				icon: "Droplets",
			},
		},
	},
	FIREFIGHTING: {
		id: "FIREFIGHTING",
		nameAr: "مكافحة الحريق",
		nameEn: "Firefighting",
		icon: "Flame",
		color: "#EF4444", // red
		subCategories: {
			alarm: {
				nameAr: "نظام الإنذار",
				nameEn: "Fire Alarm",
				defaultUnit: "نقطة",
				icon: "Bell",
			},
			sprinklers: {
				nameAr: "الرشاشات",
				nameEn: "Sprinklers",
				defaultUnit: "عدد",
				icon: "Umbrella",
			},
			hose_cabinets: {
				nameAr: "صناديق الحريق",
				nameEn: "Hose Cabinets",
				defaultUnit: "عدد",
				icon: "Box",
			},
			extinguishers: {
				nameAr: "الطفايات",
				nameEn: "Extinguishers",
				defaultUnit: "عدد",
				icon: "Cylinder",
			},
			fire_pumps: {
				nameAr: "مضخات الحريق",
				nameEn: "Fire Pumps",
				defaultUnit: "عدد",
				icon: "Activity",
			},
			fire_tank: {
				nameAr: "خزان الحريق",
				nameEn: "Fire Tank",
				defaultUnit: "م³",
				icon: "Box",
			},
		},
	},
	LOW_CURRENT: {
		id: "LOW_CURRENT",
		nameAr: "التيار الخفيف",
		nameEn: "Low Current Systems",
		icon: "Wifi",
		color: "#8B5CF6", // purple
		subCategories: {
			network: {
				nameAr: "شبكة البيانات",
				nameEn: "Data Network",
				defaultUnit: "نقطة",
				icon: "Network",
			},
			cctv: {
				nameAr: "كاميرات المراقبة",
				nameEn: "CCTV",
				defaultUnit: "عدد",
				icon: "Camera",
			},
			intercom: {
				nameAr: "الاتصال الداخلي",
				nameEn: "Intercom",
				defaultUnit: "نقطة",
				icon: "Phone",
			},
			sound: {
				nameAr: "نظام الصوت",
				nameEn: "Sound System",
				defaultUnit: "نقطة",
				icon: "Volume2",
			},
			access: {
				nameAr: "تحكم الدخول",
				nameEn: "Access Control",
				defaultUnit: "نقطة",
				icon: "Lock",
			},
		},
	},
	SPECIAL: {
		id: "SPECIAL",
		nameAr: "أنظمة خاصة",
		nameEn: "Special Systems",
		icon: "Settings",
		color: "#64748B", // slate
		subCategories: {
			elevator: {
				nameAr: "المصاعد",
				nameEn: "Elevators",
				defaultUnit: "عدد",
				icon: "ArrowUpDown",
			},
			generator: {
				nameAr: "مولد كهربائي",
				nameEn: "Generator",
				defaultUnit: "KVA",
				icon: "Zap",
			},
			solar: {
				nameAr: "طاقة شمسية",
				nameEn: "Solar PV",
				defaultUnit: "KW",
				icon: "Sun",
			},
			gas: {
				nameAr: "غاز مركزي",
				nameEn: "Central Gas",
				defaultUnit: "نقطة",
				icon: "Flame",
			},
			lightning_protection: {
				nameAr: "حماية صواعق",
				nameEn: "Lightning Protection",
				defaultUnit: "نظام",
				icon: "CloudLightning",
			},
		},
	},
};

// ─── ترتيب الفئات للعرض ───
export const MEP_CATEGORY_ORDER: MEPCategoryId[] = [
	"ELECTRICAL",
	"PLUMBING",
	"HVAC",
	"FIREFIGHTING",
	"LOW_CURRENT",
	"SPECIAL",
];

// ─── Helper: الحصول على اسم الفئة ───
export function getMEPCategoryName(
	categoryId: MEPCategoryId,
	locale: "ar" | "en" = "ar",
): string {
	const cat = MEP_CATEGORIES[categoryId];
	return locale === "ar" ? cat.nameAr : cat.nameEn;
}

export function getMEPSubCategoryName(
	categoryId: MEPCategoryId,
	subCategoryId: string,
	locale: "ar" | "en" = "ar",
): string {
	const sub = MEP_CATEGORIES[categoryId]?.subCategories[subCategoryId];
	if (!sub) return subCategoryId;
	return locale === "ar" ? sub.nameAr : sub.nameEn;
}
