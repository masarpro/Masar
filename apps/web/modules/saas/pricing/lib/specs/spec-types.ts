// ══════════════════════════════════════════════════════════════
// Specification Types — data structures for the specs system
// ══════════════════════════════════════════════════════════════

/** Specification for a single finishing item */
export interface ItemSpecification {
	categoryKey: string;
	specTypeKey: string;
	specTypeLabel: string;
	options: Record<string, unknown>;
	subItems: SpecSubItem[];
	notes?: string;
}

/** A sub-material within a specification */
export interface SpecSubItem {
	id: string;
	name: string;
	nameEn: string;
	unit: string;
	ratePerUnit: number;
	quantity: number;
	category:
		| "main"
		| "adhesive"
		| "primer"
		| "filler"
		| "accessory"
		| "protection"
		| "tool";
	isOptional: boolean;
	brand?: string;
	notes?: string;
	/** Selling unit label in Arabic (e.g. "كيس 50 كجم") */
	sellingUnit?: string;
	/** Selling unit label in English (e.g. "50kg bag") */
	sellingUnitEn?: string;
	/** Size of one selling unit (e.g. 50 for a 50kg bag) */
	sellingUnitSize?: number;
	/** Number of selling units needed = Math.ceil(quantity / sellingUnitSize) */
	sellingQuantity?: number;
}

/** Spec catalog config for one finishing category */
export interface CategorySpecConfig {
	categoryKey: string;
	specTypes: SpecTypeOption[];
	commonOptions: SpecOption[];
	qualityPresets: QualityPreset[];
}

/** A spec type option within a category */
export interface SpecTypeOption {
	key: string;
	label: string;
	labelEn: string;
	defaultOptions: Record<string, unknown>;
	subItemRates: SubItemRate[];
	specificOptions?: SpecOption[];
}

/** Rate for a sub-material */
export interface SubItemRate {
	subItemKey: string;
	name: string;
	nameEn: string;
	unit: string;
	ratePerUnit: number;
	category: SpecSubItem["category"];
	isOptional: boolean;
	conditionalOn?: string;
}

/** A user-configurable option */
export interface SpecOption {
	key: string;
	label: string;
	labelEn: string;
	type: "select" | "number" | "boolean" | "text";
	options?: { value: string; label: string; labelEn: string }[];
	defaultValue: unknown;
	affectsSubItems?: boolean;
}

/** Quality preset mapping */
export interface QualityPreset {
	quality: "ECONOMY" | "STANDARD" | "PREMIUM" | "LUXURY";
	specTypeKey: string;
	options: Record<string, unknown>;
	suggestedBrands?: string[];
}

/** Saved specification template */
export interface SpecificationTemplate {
	id: string;
	name: string;
	nameEn?: string;
	description?: string;
	organizationId: string;
	createdById: string;
	isDefault: boolean;
	isSystem: boolean;
	specs: SavedCategorySpec[];
	createdAt: Date;
	updatedAt: Date;
}

/** A single category spec within a template */
export interface SavedCategorySpec {
	categoryKey: string;
	specTypeKey: string;
	options: Record<string, unknown>;
	brand?: string;
	qualityLevel?: string;
}

/** Aggregated material from all specs */
export interface AggregatedMaterial {
	name: string;
	nameEn: string;
	unit: string;
	totalQuantity: number;
	usedInItems: string[];
	/** Selling unit label (e.g. "كيس 50 كجم") */
	sellingUnit?: string;
	/** Selling unit label in English */
	sellingUnitEn?: string;
	/** Size of one selling unit */
	sellingUnitSize?: number;
	/** Total selling units needed = Math.ceil(totalQuantity / sellingUnitSize) */
	sellingQuantity?: number;
}
