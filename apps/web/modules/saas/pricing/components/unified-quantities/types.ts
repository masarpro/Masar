// ════════════════════════════════════════════════════════════════
// Unified Quantities — Frontend Types
// (Loose structural types — Decimals come over the wire as
// number | string, so we keep that contract here.)
// ════════════════════════════════════════════════════════════════

export type Numeric = number | string | null;

export interface QuantityItem {
	id: string;
	costStudyId: string;
	organizationId: string;
	domain: string;
	categoryKey: string;
	catalogItemKey: string;
	displayName: string;
	sortOrder: number;
	isEnabled: boolean;
	primaryValue: Numeric;
	secondaryValue: Numeric;
	tertiaryValue: Numeric;
	calculationMethod: string;
	unit: string;
	computedQuantity: Numeric;
	wastagePercent: Numeric;
	effectiveQuantity: Numeric;
	contextSpaceId: string | null;
	contextScope: string | null;
	deductOpenings: boolean;
	openingsArea: Numeric;
	polygonPoints: unknown;
	linkedFromItemId: string | null;
	linkQuantityFormula: string | null;
	linkPercentValue: Numeric;
	specMaterialName: string | null;
	specMaterialBrand: string | null;
	specMaterialGrade: string | null;
	specColor: string | null;
	specSource: string | null;
	specNotes: string | null;
	materialUnitPrice: Numeric;
	laborUnitPrice: Numeric;
	materialCost: Numeric;
	laborCost: Numeric;
	totalCost: Numeric;
	markupMethod: string;
	markupPercent: Numeric;
	markupFixedAmount: Numeric;
	manualUnitPrice: Numeric;
	sellUnitPrice: Numeric;
	sellTotalAmount: Numeric;
	profitAmount: Numeric;
	profitPercent: Numeric;
	hasCustomMarkup: boolean;
	notes: string | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

export interface ItemCatalogEntry {
	id: string;
	itemKey: string;
	domain: string;
	categoryKey: string;
	subcategoryKey: string | null;
	nameAr: string;
	nameEn: string;
	descriptionAr: string | null;
	descriptionEn: string | null;
	icon: string;
	color: string | null;
	unit: string;
	defaultWastagePercent: Numeric;
	defaultCalculationMethod: string;
	requiredFields: unknown;
	defaultMaterialUnitPrice: Numeric;
	defaultLaborUnitPrice: Numeric;
	commonMaterials: unknown;
	commonColors: unknown;
	linkableFrom: string[];
	legacyDerivationType: string | null;
	legacyScope: string | null;
	displayOrder: number;
	isActive: boolean;
}

export type Domain = "FINISHING" | "MEP" | "EXTERIOR" | "SPECIAL";

export type CalculationMethod =
	| "direct_area"
	| "length_x_height"
	| "length_only"
	| "per_unit"
	| "per_room"
	| "polygon"
	| "manual"
	| "lump_sum";

export type MarkupMethod = "percentage" | "fixed_amount" | "manual_price";

export type PricingField =
	| "markup_percent"
	| "markup_fixed_amount"
	| "manual_unit_price"
	| "sell_unit_price"
	| "sell_total_amount"
	| "material_unit_price"
	| "labor_unit_price";

export interface SectionState {
	quantity: boolean;
	specifications: boolean;
	cost: boolean;
	pricing: boolean;
}

export const DEFAULT_SECTION_STATE: SectionState = {
	quantity: true,
	specifications: false,
	cost: true,
	pricing: true,
};

export const DOMAIN_STYLES: Record<
	Domain,
	{ color: string; bgColor: string; label: string; icon: string }
> = {
	FINISHING: {
		color: "#0ea5e9",
		bgColor: "#0ea5e920",
		label: "تشطيبات",
		icon: "Palette",
	},
	MEP: {
		color: "#f59e0b",
		bgColor: "#f59e0b20",
		label: "كهروميكانيكا",
		icon: "Zap",
	},
	EXTERIOR: {
		color: "#10b981",
		bgColor: "#10b98120",
		label: "خارجي",
		icon: "Home",
	},
	SPECIAL: {
		color: "#8b5cf6",
		bgColor: "#8b5cf620",
		label: "خاص",
		icon: "Sparkles",
	},
};
