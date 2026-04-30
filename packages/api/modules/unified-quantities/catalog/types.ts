// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Catalog Types
// المحرك الموحَّد — أنواع كتالوج البنود
// ════════════════════════════════════════════════════════════════

export type CalculationMethod =
	| "direct_area"
	| "length_x_height"
	| "length_only"
	| "per_unit"
	| "per_room"
	| "polygon"
	| "manual"
	| "lump_sum";

export type Domain = "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL";

export type MaterialSource = "local" | "imported";

export type GradeLevel = "اقتصادي" | "عادي" | "فاخر";

export interface RequiredField {
	key: string;
	label: string;
	unit: string;
	defaultSuggestion?: string; // "fromContext.totalFloorArea" | "linkFrom:itemKey"
	min?: number;
	max?: number;
}

export interface RequiredFieldsSchema {
	primary: RequiredField;
	secondary?: RequiredField;
	tertiary?: RequiredField;
}

export interface CommonMaterial {
	nameAr: string;
	nameEn: string;
	brand?: string;
	grade?: GradeLevel;
	suggestedPrice?: number; // ر.س / unit (مادة فقط — لا تشمل العمالة)
	source?: MaterialSource;
}

export interface CommonColor {
	nameAr: string;
	nameEn: string;
	hexValue?: string;
}

export interface CatalogEntry {
	itemKey: string; // "finishing.paint.interior" — فريد في كل المنصة
	domain: Domain;
	categoryKey: string;
	subcategoryKey?: string;

	nameAr: string;
	nameEn: string;
	descriptionAr?: string;
	descriptionEn?: string;

	icon: string; // lucide-react icon name
	color?: string; // hex

	unit: string; // "m²" | "m" | "unit" | "lump_sum"
	defaultWastagePercent: number; // 0-100
	defaultCalculationMethod: CalculationMethod;
	requiredFields: RequiredFieldsSchema;

	defaultMaterialUnitPrice?: number; // ر.س/وحدة
	defaultLaborUnitPrice?: number; // ر.س/وحدة

	commonMaterials?: CommonMaterial[];
	commonColors?: CommonColor[];

	linkableFrom?: string[]; // ["finishing.plaster.interior"]

	legacyDerivationType?: string;
	legacyScope?: string;

	displayOrder: number; // ضمن الـ domain — لترتيب البنود في القوائم
}

export interface PresetEntry {
	key: string;
	nameAr: string;
	nameEn: string;
	descriptionAr?: string;
	icon: string;
	itemKeys: string[];
}
