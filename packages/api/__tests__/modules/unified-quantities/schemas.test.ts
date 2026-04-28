import { describe, it, expect } from "vitest";
import {
	upsertQuantityItemSchema,
	linkItemsSchema,
	reorderItemsSchema,
} from "../../../modules/unified-quantities/schemas/quantity-item.schema";
import {
	upsertSpaceSchema,
	upsertOpeningSchema,
} from "../../../modules/unified-quantities/schemas/context.schema";
import {
	updatePricingSchema,
	updateGlobalMarkupSchema,
	bulkUpdatePricingSchema,
} from "../../../modules/unified-quantities/schemas/pricing.schema";
import {
	getCatalogSchema,
	applyPresetSchema,
} from "../../../modules/unified-quantities/schemas/catalog.schema";

// ════════════════════════════════════════════════════════════
// upsertQuantityItemSchema
// ════════════════════════════════════════════════════════════

describe("upsertQuantityItemSchema", () => {
	const valid = {
		organizationId: "org-1",
		costStudyId: "study-1",
		domain: "FINISHING",
		categoryKey: "paint",
		catalogItemKey: "finishing.paint.interior",
		displayName: "دهان داخلي — صالة",
		calculationMethod: "direct_area",
		unit: "m²",
		primaryValue: 100,
		wastagePercent: 10,
		markupMethod: "percentage",
		markupPercent: 30,
		hasCustomMarkup: false,
	};

	it("accepts a valid item", () => {
		expect(upsertQuantityItemSchema.parse(valid)).toMatchObject({
			displayName: "دهان داخلي — صالة",
			primaryValue: 100,
			wastagePercent: 10,
		});
	});

	it("coerces string Decimal inputs to numbers", () => {
		const r = upsertQuantityItemSchema.parse({
			...valid,
			primaryValue: "100.5",
			wastagePercent: "12",
		});
		expect(r.primaryValue).toBe(100.5);
		expect(r.wastagePercent).toBe(12);
	});

	it("rejects wastage > 100", () => {
		expect(() =>
			upsertQuantityItemSchema.parse({ ...valid, wastagePercent: 150 }),
		).toThrow(/الهدر/);
	});

	it("rejects unknown calculationMethod", () => {
		expect(() =>
			upsertQuantityItemSchema.parse({ ...valid, calculationMethod: "weird" }),
		).toThrow();
	});

	it("rejects displayName > 300 chars", () => {
		expect(() =>
			upsertQuantityItemSchema.parse({
				...valid,
				displayName: "x".repeat(301),
			}),
		).toThrow();
	});

	it("requires polygonPoints to have ≥3 points if provided", () => {
		expect(() =>
			upsertQuantityItemSchema.parse({
				...valid,
				calculationMethod: "polygon",
				polygonPoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
			}),
		).toThrow();
	});

	it("accepts valid polygon points", () => {
		const r = upsertQuantityItemSchema.parse({
			...valid,
			calculationMethod: "polygon",
			polygonPoints: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 0, y: 10 },
			],
		});
		expect(r.polygonPoints).toHaveLength(3);
	});

	it("defaults sortOrder=0, isEnabled=true, hasCustomMarkup=false", () => {
		const minimal = upsertQuantityItemSchema.parse({
			organizationId: "org-1",
			costStudyId: "study-1",
			domain: "MEP",
			categoryKey: "electrical",
			catalogItemKey: "mep.electrical.outlet_normal",
			displayName: "مقابس",
			calculationMethod: "per_unit",
			unit: "نقطة",
			markupMethod: "percentage",
			hasCustomMarkup: false,
			wastagePercent: 5,
		});
		expect(minimal.sortOrder).toBe(0);
		expect(minimal.isEnabled).toBe(true);
		expect(minimal.deductOpenings).toBe(false);
	});
});

// ════════════════════════════════════════════════════════════
// linkItemsSchema
// ════════════════════════════════════════════════════════════

describe("linkItemsSchema", () => {
	it("accepts valid link", () => {
		const r = linkItemsSchema.parse({
			organizationId: "org-1",
			itemId: "item-1",
			linkedFromItemId: "item-source",
			linkQuantityFormula: "MINUS_WET_AREAS",
			linkPercentValue: null,
		});
		expect(r.linkQuantityFormula).toBe("MINUS_WET_AREAS");
	});

	it("accepts unlink (null linkedFromItemId)", () => {
		const r = linkItemsSchema.parse({
			organizationId: "org-1",
			itemId: "item-1",
			linkedFromItemId: null,
		});
		expect(r.linkedFromItemId).toBeNull();
		expect(r.linkQuantityFormula).toBe("SAME"); // default
	});

	it("rejects unknown formula", () => {
		expect(() =>
			linkItemsSchema.parse({
				organizationId: "org-1",
				itemId: "item-1",
				linkedFromItemId: "item-source",
				linkQuantityFormula: "UNKNOWN",
			}),
		).toThrow();
	});
});

// ════════════════════════════════════════════════════════════
// reorderItemsSchema
// ════════════════════════════════════════════════════════════

describe("reorderItemsSchema", () => {
	it("accepts non-empty itemIds array", () => {
		const r = reorderItemsSchema.parse({
			organizationId: "org-1",
			costStudyId: "study-1",
			itemIds: ["a", "b", "c"],
		});
		expect(r.itemIds).toHaveLength(3);
	});

	it("rejects empty array", () => {
		expect(() =>
			reorderItemsSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				itemIds: [],
			}),
		).toThrow();
	});

	it("rejects > 500 items", () => {
		expect(() =>
			reorderItemsSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				itemIds: Array.from({ length: 501 }, (_, i) => `item-${i}`),
			}),
		).toThrow();
	});
});

// ════════════════════════════════════════════════════════════
// upsertSpaceSchema / upsertOpeningSchema
// ════════════════════════════════════════════════════════════

describe("upsertSpaceSchema", () => {
	it("accepts a wet area kitchen with dimensions", () => {
		const r = upsertSpaceSchema.parse({
			organizationId: "org-1",
			costStudyId: "study-1",
			name: "المطبخ",
			spaceType: "room",
			length: 4,
			width: 3,
			height: 3,
			isWetArea: true,
		});
		expect(r.isWetArea).toBe(true);
		expect(r.spaceType).toBe("room");
	});

	it("rejects unknown spaceType", () => {
		expect(() =>
			upsertSpaceSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				name: "x",
				spaceType: "weird",
			}),
		).toThrow();
	});
});

describe("upsertOpeningSchema", () => {
	it("accepts a door with valid dimensions", () => {
		const r = upsertOpeningSchema.parse({
			organizationId: "org-1",
			costStudyId: "study-1",
			name: "باب الصالة",
			openingType: "door",
			width: 0.9,
			height: 2.1,
			count: 1,
		});
		expect(r.computedArea).toBeUndefined(); // schema doesn't compute — handler does
		expect(r.deductFromInteriorFinishes).toBe(true);
	});

	it("rejects width=0 (positive required)", () => {
		expect(() =>
			upsertOpeningSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				name: "x",
				openingType: "door",
				width: 0,
				height: 2.1,
			}),
		).toThrow();
	});

	it("clamps count to ≥1", () => {
		expect(() =>
			upsertOpeningSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				name: "x",
				openingType: "door",
				width: 0.9,
				height: 2.1,
				count: 0,
			}),
		).toThrow();
	});
});

// ════════════════════════════════════════════════════════════
// pricing schemas
// ════════════════════════════════════════════════════════════

describe("updatePricingSchema", () => {
	it("accepts all 7 changedField values", () => {
		const fields = [
			"material_unit_price",
			"labor_unit_price",
			"markup_percent",
			"markup_fixed_amount",
			"manual_unit_price",
			"sell_unit_price",
			"sell_total_amount",
		];
		for (const f of fields) {
			expect(() =>
				updatePricingSchema.parse({
					organizationId: "org-1",
					id: "item-1",
					changedField: f,
					newValue: 50,
				}),
			).not.toThrow();
		}
	});

	it("rejects unknown changedField", () => {
		expect(() =>
			updatePricingSchema.parse({
				organizationId: "org-1",
				id: "item-1",
				changedField: "nonsense",
				newValue: 50,
			}),
		).toThrow();
	});
});

describe("updateGlobalMarkupSchema", () => {
	it("accepts a valid update", () => {
		expect(() =>
			updateGlobalMarkupSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				globalMarkupPercent: 30,
				applyMode: "non_custom_only",
			}),
		).not.toThrow();
	});

	it("rejects globalMarkupPercent > 1000", () => {
		expect(() =>
			updateGlobalMarkupSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				globalMarkupPercent: 1500,
				applyMode: "all_items",
			}),
		).toThrow();
	});

	it("rejects unknown applyMode", () => {
		expect(() =>
			updateGlobalMarkupSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				globalMarkupPercent: 30,
				applyMode: "delete_all",
			}),
		).toThrow();
	});
});

describe("bulkUpdatePricingSchema", () => {
	it("accepts only the 4 'safe' changedField values", () => {
		const safe = [
			"material_unit_price",
			"labor_unit_price",
			"markup_percent",
			"markup_fixed_amount",
		];
		for (const f of safe) {
			expect(() =>
				bulkUpdatePricingSchema.parse({
					organizationId: "org-1",
					costStudyId: "study-1",
					itemIds: ["item-1"],
					changedField: f,
					newValue: 50,
				}),
			).not.toThrow();
		}
	});

	it("rejects unsafe fields like sell_unit_price for bulk", () => {
		expect(() =>
			bulkUpdatePricingSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				itemIds: ["item-1"],
				changedField: "sell_unit_price",
				newValue: 50,
			}),
		).toThrow();
	});
});

// ════════════════════════════════════════════════════════════
// catalog schemas
// ════════════════════════════════════════════════════════════

describe("getCatalogSchema", () => {
	it("accepts only organizationId (all filters optional)", () => {
		expect(() => getCatalogSchema.parse({ organizationId: "org-1" })).not.toThrow();
	});

	it("accepts domain + categoryKey + search filters", () => {
		const r = getCatalogSchema.parse({
			organizationId: "org-1",
			domain: "FINISHING",
			categoryKey: "paint",
			search: "دهان",
		});
		expect(r.domain).toBe("FINISHING");
	});

	it("rejects unknown domain", () => {
		expect(() =>
			getCatalogSchema.parse({ organizationId: "org-1", domain: "WEIRD" }),
		).toThrow();
	});
});

describe("applyPresetSchema", () => {
	it("accepts a valid preset application", () => {
		const r = applyPresetSchema.parse({
			organizationId: "org-1",
			costStudyId: "study-1",
			presetKey: "villa_standard",
		});
		expect(r.presetKey).toBe("villa_standard");
	});

	it("rejects empty presetKey", () => {
		expect(() =>
			applyPresetSchema.parse({
				organizationId: "org-1",
				costStudyId: "study-1",
				presetKey: "",
			}),
		).toThrow();
	});
});
