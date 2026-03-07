import type { SpecificationTemplate } from "./spec-types";

type SystemTemplate = Omit<
	SpecificationTemplate,
	"id" | "organizationId" | "createdById" | "createdAt" | "updatedAt"
>;

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
	// ══════════════════════════════════════════════════════════════
	// اقتصادي — مناسب للشقق الاستثمارية
	// ══════════════════════════════════════════════════════════════
	{
		name: "تشطيب اقتصادي",
		nameEn: "Economy Finishing",
		description:
			"مواصفات أساسية بتكلفة منخفضة — مناسب للشقق الاستثمارية",
		isDefault: false,
		isSystem: true,
		specs: [
			{
				categoryKey: "FINISHING_WATERPROOFING",
				specTypeKey: "cement_flexible",
				options: { layers: 2, hasReinforcement: false },
			},
			{
				categoryKey: "FINISHING_THERMAL_INSULATION",
				specTypeKey: "eps_50",
				options: { thickness: 50, hasVaporBarrier: false },
			},
			{
				categoryKey: "FINISHING_INTERNAL_PLASTER",
				specTypeKey: "cement_manual",
				options: {
					thickness: 20,
					mixRatio: "1:4",
					meshType: "none",
				},
			},
			{
				categoryKey: "FINISHING_EXTERNAL_PLASTER",
				specTypeKey: "cement_manual",
				options: { thickness: 20, mixRatio: "1:4" },
			},
			{
				categoryKey: "FINISHING_INTERIOR_PAINT",
				specTypeKey: "plastic_matt",
				options: { preparation: "light_putty", coats: 2 },
				brand: "National Paints",
			},
			{
				categoryKey: "FINISHING_FACADE_PAINT",
				specTypeKey: "acrylic_exterior",
				options: { coats: 2 },
				brand: "National Paints",
			},
			{
				categoryKey: "FINISHING_BOUNDARY_PAINT",
				specTypeKey: "acrylic_exterior",
				options: { coats: 2 },
			},
			{
				categoryKey: "FINISHING_FLOOR_TILES",
				specTypeKey: "ceramic_40x40",
				options: {
					installation: "adhesive",
					hasScreed: true,
					groutType: "normal",
				},
				qualityLevel: "ECONOMY",
			},
			{
				categoryKey: "FINISHING_WALL_TILES",
				specTypeKey: "ceramic_30x60",
				options: { installation: "adhesive", groutType: "normal" },
				qualityLevel: "ECONOMY",
			},
			{
				categoryKey: "FINISHING_FALSE_CEILING",
				specTypeKey: "suspended_tiles",
				options: {},
			},
			{
				categoryKey: "FINISHING_INTERIOR_DOORS",
				specTypeKey: "hdf",
				options: {},
			},
			{
				categoryKey: "FINISHING_EXTERIOR_DOORS",
				specTypeKey: "steel_security",
				options: {},
			},
			{
				categoryKey: "FINISHING_WINDOWS",
				specTypeKey: "aluminum_standard",
				options: { hasInsectScreen: false },
			},
			{
				categoryKey: "FINISHING_BATHROOMS",
				specTypeKey: "standard_set",
				options: {},
				qualityLevel: "ECONOMY",
			},
			{
				categoryKey: "FINISHING_MARBLE_VANITIES",
				specTypeKey: "marble_local",
				options: {},
			},
			{
				categoryKey: "FINISHING_KITCHEN",
				specTypeKey: "pvc_membrane",
				options: { countertop: "local_granite" },
			},
			{
				categoryKey: "FINISHING_INTERNAL_STAIRS",
				specTypeKey: "granite",
				options: { hasNosing: false },
			},
			{
				categoryKey: "FINISHING_EXTERNAL_STAIRS",
				specTypeKey: "granite",
				options: {},
			},
			{
				categoryKey: "FINISHING_RAILINGS",
				specTypeKey: "wrought_iron",
				options: {},
			},
			{
				categoryKey: "FINISHING_STONE_FACADE",
				specTypeKey: "manufactured",
				options: {},
			},
			{
				categoryKey: "FINISHING_FACADE_DECOR",
				specTypeKey: "gypsum_decor",
				options: {},
			},
			{
				categoryKey: "FINISHING_YARD_PAVING",
				specTypeKey: "interlock_6cm",
				options: {},
			},
			{
				categoryKey: "FINISHING_FENCE_GATES",
				specTypeKey: "iron_gate",
				options: { hasMotor: false },
			},
			{
				categoryKey: "FINISHING_LANDSCAPING",
				specTypeKey: "artificial_grass",
				options: {},
			},
			{
				categoryKey: "FINISHING_ROOF",
				specTypeKey: "waterproof_only",
				options: {},
			},
			{
				categoryKey: "FINISHING_INTERIOR_DECOR",
				specTypeKey: "gypsum_decor",
				options: {},
			},
		],
	},

	// ══════════════════════════════════════════════════════════════
	// متوسط — الأكثر شيوعاً للفلل السكنية
	// ══════════════════════════════════════════════════════════════
	{
		name: "تشطيب متوسط",
		nameEn: "Standard Finishing",
		description: "مواصفات متوازنة — الأكثر شيوعاً للفلل السكنية",
		isDefault: true,
		isSystem: true,
		specs: [
			{
				categoryKey: "FINISHING_WATERPROOFING",
				specTypeKey: "cement_flexible",
				options: { layers: 2, hasReinforcement: true },
				brand: "Sika",
			},
			{
				categoryKey: "FINISHING_THERMAL_INSULATION",
				specTypeKey: "xps_50",
				options: { thickness: 50, hasVaporBarrier: false },
				brand: "SABIC",
			},
			{
				categoryKey: "FINISHING_INTERNAL_PLASTER",
				specTypeKey: "cement_machine",
				options: { thickness: 15 },
			},
			{
				categoryKey: "FINISHING_EXTERNAL_PLASTER",
				specTypeKey: "cement_manual",
				options: { thickness: 20, mixRatio: "1:3" },
			},
			{
				categoryKey: "FINISHING_INTERIOR_PAINT",
				specTypeKey: "plastic_satin",
				options: { preparation: "full_putty", coats: 2 },
				brand: "Jotun",
			},
			{
				categoryKey: "FINISHING_FACADE_PAINT",
				specTypeKey: "acrylic_exterior",
				options: { coats: 2 },
				brand: "Jotun",
			},
			{
				categoryKey: "FINISHING_BOUNDARY_PAINT",
				specTypeKey: "acrylic_exterior",
				options: { coats: 2 },
				brand: "Jotun",
			},
			{
				categoryKey: "FINISHING_FLOOR_TILES",
				specTypeKey: "porcelain_60x60",
				options: {
					installation: "adhesive",
					hasScreed: true,
					groutType: "normal",
				},
				qualityLevel: "STANDARD",
			},
			{
				categoryKey: "FINISHING_WALL_TILES",
				specTypeKey: "porcelain_60x60",
				options: { installation: "adhesive", groutType: "normal" },
				qualityLevel: "STANDARD",
			},
			{
				categoryKey: "FINISHING_FALSE_CEILING",
				specTypeKey: "gypsum_board_flat",
				options: { boardType: "standard", includesPaint: true },
				brand: "Knauf",
			},
			{
				categoryKey: "FINISHING_INTERIOR_DOORS",
				specTypeKey: "wpc",
				options: {},
			},
			{
				categoryKey: "FINISHING_EXTERIOR_DOORS",
				specTypeKey: "steel_security",
				options: {},
			},
			{
				categoryKey: "FINISHING_WINDOWS",
				specTypeKey: "aluminum_thermal_break",
				options: { hasInsectScreen: true },
			},
			{
				categoryKey: "FINISHING_BATHROOMS",
				specTypeKey: "standard_set",
				options: {},
				qualityLevel: "STANDARD",
			},
			{
				categoryKey: "FINISHING_MARBLE_VANITIES",
				specTypeKey: "marble_local",
				options: {},
			},
			{
				categoryKey: "FINISHING_KITCHEN",
				specTypeKey: "mdf_lacquer",
				options: { countertop: "local_granite" },
			},
			{
				categoryKey: "FINISHING_INTERNAL_STAIRS",
				specTypeKey: "marble",
				options: { hasNosing: false },
			},
			{
				categoryKey: "FINISHING_EXTERNAL_STAIRS",
				specTypeKey: "granite",
				options: {},
			},
			{
				categoryKey: "FINISHING_RAILINGS",
				specTypeKey: "wrought_iron",
				options: {},
			},
			{
				categoryKey: "FINISHING_STONE_FACADE",
				specTypeKey: "natural_riyadh",
				options: {},
			},
			{
				categoryKey: "FINISHING_FACADE_DECOR",
				specTypeKey: "grc_decor",
				options: {},
			},
			{
				categoryKey: "FINISHING_YARD_PAVING",
				specTypeKey: "interlock_8cm",
				options: {},
			},
			{
				categoryKey: "FINISHING_FENCE_GATES",
				specTypeKey: "iron_gate",
				options: { hasMotor: true, hasRemote: true },
			},
			{
				categoryKey: "FINISHING_LANDSCAPING",
				specTypeKey: "artificial_grass",
				options: {},
			},
			{
				categoryKey: "FINISHING_ROOF",
				specTypeKey: "waterproof_tiles",
				options: {},
			},
			{
				categoryKey: "FINISHING_INTERIOR_DECOR",
				specTypeKey: "gypsum_decor",
				options: {},
			},
		],
	},

	// ══════════════════════════════════════════════════════════════
	// فاخر — للفلل الفاخرة
	// ══════════════════════════════════════════════════════════════
	{
		name: "تشطيب فاخر",
		nameEn: "Premium Finishing",
		description: "مواصفات عالية الجودة — للفلل الفاخرة",
		isDefault: false,
		isSystem: true,
		specs: [
			{
				categoryKey: "FINISHING_WATERPROOFING",
				specTypeKey: "bitumen_rolls",
				options: {
					layers: 3,
					hasReinforcement: true,
					hasProtection: "plaster_3cm",
				},
				brand: "Index",
			},
			{
				categoryKey: "FINISHING_THERMAL_INSULATION",
				specTypeKey: "xps_50",
				options: { thickness: 75, hasVaporBarrier: true },
				brand: "SABIC",
			},
			{
				categoryKey: "FINISHING_INTERNAL_PLASTER",
				specTypeKey: "gypsum_machine",
				options: { thickness: 10 },
				brand: "Knauf",
			},
			{
				categoryKey: "FINISHING_EXTERNAL_PLASTER",
				specTypeKey: "cement_machine",
				options: { thickness: 20, mixRatio: "1:3" },
			},
			{
				categoryKey: "FINISHING_INTERIOR_PAINT",
				specTypeKey: "acrylic",
				options: { preparation: "full_putty", coats: 3 },
				brand: "Caparol",
			},
			{
				categoryKey: "FINISHING_FACADE_PAINT",
				specTypeKey: "elastomeric",
				options: { coats: 2 },
				brand: "Caparol",
			},
			{
				categoryKey: "FINISHING_BOUNDARY_PAINT",
				specTypeKey: "texture_exterior",
				options: { coats: 1 },
				brand: "Caparol",
			},
			{
				categoryKey: "FINISHING_FLOOR_TILES",
				specTypeKey: "porcelain_120x120",
				options: {
					installation: "adhesive",
					hasScreed: true,
					groutType: "normal",
				},
				qualityLevel: "PREMIUM",
			},
			{
				categoryKey: "FINISHING_WALL_TILES",
				specTypeKey: "porcelain_80x80",
				options: { installation: "adhesive", groutType: "epoxy" },
				qualityLevel: "PREMIUM",
			},
			{
				categoryKey: "FINISHING_FALSE_CEILING",
				specTypeKey: "gypsum_board_design",
				options: { boardType: "standard", includesPaint: true },
				brand: "Knauf",
			},
			{
				categoryKey: "FINISHING_INTERIOR_DOORS",
				specTypeKey: "solid_wood",
				options: {},
			},
			{
				categoryKey: "FINISHING_EXTERIOR_DOORS",
				specTypeKey: "solid_wood_exterior",
				options: {},
			},
			{
				categoryKey: "FINISHING_WINDOWS",
				specTypeKey: "upvc",
				options: { hasInsectScreen: true },
				brand: "Rehau",
			},
			{
				categoryKey: "FINISHING_BATHROOMS",
				specTypeKey: "premium_set",
				options: { hasBathtub: true },
				qualityLevel: "LUXURY",
				brand: "TOTO",
			},
			{
				categoryKey: "FINISHING_MARBLE_VANITIES",
				specTypeKey: "quartz",
				options: {},
			},
			{
				categoryKey: "FINISHING_KITCHEN",
				specTypeKey: "acrylic",
				options: { countertop: "quartz" },
			},
			{
				categoryKey: "FINISHING_INTERNAL_STAIRS",
				specTypeKey: "marble",
				options: { hasNosing: true },
			},
			{
				categoryKey: "FINISHING_EXTERNAL_STAIRS",
				specTypeKey: "granite",
				options: { hasNosing: true },
			},
			{
				categoryKey: "FINISHING_RAILINGS",
				specTypeKey: "glass_stainless",
				options: {},
			},
			{
				categoryKey: "FINISHING_STONE_FACADE",
				specTypeKey: "natural_imported",
				options: {},
			},
			{
				categoryKey: "FINISHING_FACADE_DECOR",
				specTypeKey: "grc_decor",
				options: {},
			},
			{
				categoryKey: "FINISHING_YARD_PAVING",
				specTypeKey: "stamped_concrete",
				options: {},
			},
			{
				categoryKey: "FINISHING_FENCE_GATES",
				specTypeKey: "aluminum_gate",
				options: { hasMotor: true, hasRemote: true },
			},
			{
				categoryKey: "FINISHING_LANDSCAPING",
				specTypeKey: "natural_grass",
				options: { hasIrrigation: true },
			},
			{
				categoryKey: "FINISHING_ROOF",
				specTypeKey: "waterproof_tiles",
				options: {},
			},
			{
				categoryKey: "FINISHING_INTERIOR_DECOR",
				specTypeKey: "wood_decor",
				options: {},
			},
		],
	},
];
