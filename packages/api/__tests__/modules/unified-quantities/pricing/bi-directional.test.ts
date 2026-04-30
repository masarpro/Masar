import { describe, it, expect } from "vitest";
import { solvePricing } from "../../../../modules/unified-quantities/pricing/bi-directional-solver";
import type { BiDirectionalInput } from "../../../../modules/unified-quantities/pricing/types";

// قاعدة: مادة 18، عمالة 7 → unitCost 25 ر.س، الكمية 100 → totalCost 2500
const baseline = (overrides: Partial<BiDirectionalInput> = {}): BiDirectionalInput => ({
	changedField: "markup_percent",
	newValue: 30,
	effectiveQuantity: 100,
	materialUnitPrice: 18,
	laborUnitPrice: 7,
	currentMarkupMethod: "percentage",
	currentMarkupPercent: 30,
	hasCustomMarkup: false,
	...overrides,
});

// ════════════════════════════════════════════════════════════
// تغيير markup_percent
// ════════════════════════════════════════════════════════════

describe("solvePricing — markup_percent", () => {
	it("sets method=percentage, hasCustomMarkup=true", () => {
		const r = solvePricing(baseline({ changedField: "markup_percent", newValue: 40 }));
		expect(r.markupMethod).toBe("percentage");
		expect(r.markupPercent).toBeCloseTo(40, 4);
		expect(r.hasCustomMarkup).toBe(true);
	});

	it("computes new sell price (25 × 1.4 = 35)", () => {
		const r = solvePricing(baseline({ changedField: "markup_percent", newValue: 40 }));
		expect(r.sellUnitPrice).toBeCloseTo(35, 4);
		expect(r.sellTotalAmount).toBeCloseTo(3500, 2);
	});

	it("clears markupFixedAmount and manualUnitPrice (single-source rule)", () => {
		const r = solvePricing(
			baseline({
				changedField: "markup_percent",
				newValue: 30,
				currentMarkupFixedAmount: 99,
				currentManualUnitPrice: 99,
			}),
		);
		expect(r.markupFixedAmount).toBeNull();
		expect(r.manualUnitPrice).toBeNull();
	});

	it("0% → sell == cost, profit 0", () => {
		const r = solvePricing(baseline({ changedField: "markup_percent", newValue: 0 }));
		expect(r.sellUnitPrice).toBe(25);
		expect(r.profitAmount).toBe(0);
	});

	it("negative percent → loss + warning", () => {
		const r = solvePricing(baseline({ changedField: "markup_percent", newValue: -20 }));
		expect(r.sellUnitPrice).toBeCloseTo(20, 4);
		expect(r.profitAmount).toBeCloseTo(-500, 2);
		expect(r.warnings.some((w) => w.includes("خسارة"))).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// تغيير markup_fixed_amount
// ════════════════════════════════════════════════════════════

describe("solvePricing — markup_fixed_amount", () => {
	it("sets method=fixed_amount, sell = cost + amount", () => {
		const r = solvePricing(baseline({ changedField: "markup_fixed_amount", newValue: 15 }));
		expect(r.markupMethod).toBe("fixed_amount");
		expect(r.markupFixedAmount).toBeCloseTo(15, 4);
		expect(r.sellUnitPrice).toBeCloseTo(40, 4); // 25 + 15
		expect(r.markupPercent).toBeNull();
		expect(r.manualUnitPrice).toBeNull();
		expect(r.hasCustomMarkup).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// تغيير manual_unit_price (مباشرة)
// ════════════════════════════════════════════════════════════

describe("solvePricing — manual_unit_price", () => {
	it("sets method=manual_price, sell = newValue", () => {
		const r = solvePricing(baseline({ changedField: "manual_unit_price", newValue: 50 }));
		expect(r.markupMethod).toBe("manual_price");
		expect(r.manualUnitPrice).toBeCloseTo(50, 4);
		expect(r.sellUnitPrice).toBeCloseTo(50, 4);
		expect(r.markupPercent).toBeNull(); // not stored — implied only
	});

	it("clamps negative manual price to 0", () => {
		const r = solvePricing(baseline({ changedField: "manual_unit_price", newValue: -50 }));
		expect(r.sellUnitPrice).toBe(0);
		expect(r.manualUnitPrice).toBe(0);
	});
});

// ════════════════════════════════════════════════════════════
// تغيير sell_unit_price (يصبح manual_price + implied %)
// ════════════════════════════════════════════════════════════

describe("solvePricing — sell_unit_price", () => {
	it("converts to manual_price and computes implied markupPercent", () => {
		// cost 25 → user types sell 32.5 → implied 30%
		const r = solvePricing(baseline({ changedField: "sell_unit_price", newValue: 32.5 }));
		expect(r.markupMethod).toBe("manual_price");
		expect(r.manualUnitPrice).toBeCloseTo(32.5, 4);
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4);
		expect(r.markupPercent).toBeCloseTo(30, 4);
	});

	it("returns markupPercent=null when unitCost is zero", () => {
		const r = solvePricing(
			baseline({
				changedField: "sell_unit_price",
				newValue: 50,
				materialUnitPrice: 0,
				laborUnitPrice: 0,
			}),
		);
		expect(r.markupPercent).toBeNull();
		expect(r.sellUnitPrice).toBe(50);
	});

	it("hasCustomMarkup becomes true after manual price entry", () => {
		const r = solvePricing(
			baseline({ changedField: "sell_unit_price", newValue: 30, hasCustomMarkup: false }),
		);
		expect(r.hasCustomMarkup).toBe(true);
	});

	it("sell below cost → negative implied markup + warning", () => {
		const r = solvePricing(baseline({ changedField: "sell_unit_price", newValue: 20 }));
		expect(r.markupPercent).toBeCloseTo(-20, 4); // (20-25)/25 × 100
		expect(r.warnings.some((w) => w.includes("خسارة"))).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// تغيير sell_total_amount
// ════════════════════════════════════════════════════════════

describe("solvePricing — sell_total_amount", () => {
	it("derives sell unit from total / quantity", () => {
		const r = solvePricing(baseline({ changedField: "sell_total_amount", newValue: 4000 }));
		// 4000 / 100 = 40 → manual_price 40
		expect(r.markupMethod).toBe("manual_price");
		expect(r.manualUnitPrice).toBeCloseTo(40, 4);
		expect(r.sellUnitPrice).toBeCloseTo(40, 4);
		expect(r.markupPercent).toBeCloseTo(60, 4); // (40-25)/25 = 60%
	});

	it("warns and skips when effectiveQuantity is zero", () => {
		const r = solvePricing(
			baseline({ changedField: "sell_total_amount", newValue: 1000, effectiveQuantity: 0 }),
		);
		expect(r.warnings.some((w) => w.includes("كمية صفر"))).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// تغيير material_unit_price / labor_unit_price (keep markup)
// ════════════════════════════════════════════════════════════

describe("solvePricing — material/labor changes preserve markup", () => {
	it("changing material_unit_price keeps percentage markup, recomputes sell", () => {
		// كان cost 25 + 30% = 32.5؛ غيّر material إلى 22 → cost 29 + 30% = 37.7
		const r = solvePricing({
			changedField: "material_unit_price",
			newValue: 22,
			effectiveQuantity: 100,
			materialUnitPrice: 18, // ignored — newValue overrides
			laborUnitPrice: 7,
			currentMarkupMethod: "percentage",
			currentMarkupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.materialUnitPrice).toBe(22);
		expect(r.markupMethod).toBe("percentage");
		expect(r.markupPercent).toBeCloseTo(30, 4);
		expect(r.sellUnitPrice).toBeCloseTo(37.7, 4);
	});

	it("changing labor_unit_price with manual_price keeps the manual price (cost change ≠ price change)", () => {
		const r = solvePricing({
			changedField: "labor_unit_price",
			newValue: 12,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: "manual_price",
			currentManualUnitPrice: 50,
			hasCustomMarkup: true,
		});
		// Cost: 18 + 12 = 30، السعر اليدوي يبقى 50
		expect(r.laborUnitPrice).toBe(12);
		expect(r.markupMethod).toBe("manual_price");
		expect(r.manualUnitPrice).toBeCloseTo(50, 4);
		expect(r.sellUnitPrice).toBeCloseTo(50, 4);
		expect(r.profitAmount).toBeCloseTo(2000, 2); // (50-30) × 100
	});

	it("changing material_unit_price with fixed_amount keeps the fixed surcharge", () => {
		const r = solvePricing({
			changedField: "material_unit_price",
			newValue: 22,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: "fixed_amount",
			currentMarkupFixedAmount: 10,
			hasCustomMarkup: true,
		});
		expect(r.markupMethod).toBe("fixed_amount");
		expect(r.markupFixedAmount).toBe(10);
		expect(r.sellUnitPrice).toBeCloseTo(39, 4); // (22+7)+10
	});

	it("negative material clamped to 0 + warning", () => {
		const r = solvePricing({
			changedField: "material_unit_price",
			newValue: -10,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: "percentage",
			currentMarkupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.materialUnitPrice).toBe(0);
		expect(r.warnings.some((w) => w.includes("سعر مادة سالب"))).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// Round-trip integrity (THE crucial guarantee)
// ════════════════════════════════════════════════════════════

describe("solvePricing — round-trip integrity", () => {
	const cost = { materialUnitPrice: 18, laborUnitPrice: 7 }; // unitCost 25
	const qty = 100;

	it("markup_percent → sell_unit_price → implied markup_percent (== original)", () => {
		const r1 = solvePricing({
			changedField: "markup_percent",
			newValue: 30,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: true,
		});
		expect(r1.sellUnitPrice).toBeCloseTo(32.5, 4);

		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: r1.markupMethod,
			hasCustomMarkup: r1.hasCustomMarkup,
		});
		expect(r2.markupPercent).toBeCloseTo(30, 2);
		expect(r2.sellUnitPrice).toBeCloseTo(r1.sellUnitPrice, 4);
	});

	it("markup_fixed_amount → sell_unit_price → implied markup_percent (consistent)", () => {
		// fixed=10 → sell=35 → implied=40%
		const r1 = solvePricing({
			changedField: "markup_fixed_amount",
			newValue: 10,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "fixed_amount",
			hasCustomMarkup: true,
		});
		expect(r1.sellUnitPrice).toBeCloseTo(35, 4);

		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: r1.markupMethod,
			hasCustomMarkup: true,
		});
		expect(r2.markupPercent).toBeCloseTo(40, 2);
	});

	it("manual_unit_price → sell_unit_price (no-op, same value)", () => {
		const r1 = solvePricing({
			changedField: "manual_unit_price",
			newValue: 45,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "manual_price",
			hasCustomMarkup: true,
		});
		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: r1.markupMethod,
			hasCustomMarkup: true,
		});
		expect(r2.sellUnitPrice).toBeCloseTo(r1.sellUnitPrice, 4);
		expect(r2.manualUnitPrice).toBeCloseTo(r1.manualUnitPrice ?? 0, 4);
	});

	it("sell_total_amount → sell_unit_price (consistent)", () => {
		const r1 = solvePricing({
			changedField: "sell_total_amount",
			newValue: 4000,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "percentage",
			currentMarkupPercent: 30,
			hasCustomMarkup: false,
		});
		expect(r1.sellUnitPrice).toBeCloseTo(40, 4);

		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: r1.markupMethod,
			hasCustomMarkup: true,
		});
		expect(r2.sellUnitPrice).toBeCloseTo(40, 4);
		expect(r2.markupPercent).toBeCloseTo(60, 2);
	});

	it("material change → recompute → still preserves markup_percent", () => {
		const r1 = solvePricing({
			changedField: "markup_percent",
			newValue: 30,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: true,
		});

		const r2 = solvePricing({
			changedField: "material_unit_price",
			newValue: 25,
			effectiveQuantity: qty,
			materialUnitPrice: r1.materialUnitPrice,
			laborUnitPrice: r1.laborUnitPrice,
			currentMarkupMethod: r1.markupMethod,
			currentMarkupPercent: r1.markupPercent ?? undefined,
			hasCustomMarkup: r1.hasCustomMarkup,
		});
		// New cost: 25 + 7 = 32 → 32 × 1.30 = 41.6
		expect(r2.markupPercent).toBeCloseTo(30, 4);
		expect(r2.sellUnitPrice).toBeCloseTo(41.6, 4);
	});

	it("3-step round-trip: material → markup_percent → sell_unit_price", () => {
		// Start: cost 25, markup 30% → sell 32.5
		const r1 = solvePricing({
			changedField: "markup_percent",
			newValue: 30,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: false,
		});
		expect(r1.sellUnitPrice).toBeCloseTo(32.5, 4);

		// Step 2: change material to 22 → cost 29, markup 30% → sell 37.7
		const r2 = solvePricing({
			changedField: "material_unit_price",
			newValue: 22,
			effectiveQuantity: qty,
			materialUnitPrice: r1.materialUnitPrice,
			laborUnitPrice: r1.laborUnitPrice,
			currentMarkupMethod: r1.markupMethod,
			currentMarkupPercent: r1.markupPercent ?? undefined,
			hasCustomMarkup: r1.hasCustomMarkup,
		});
		expect(r2.sellUnitPrice).toBeCloseTo(37.7, 4);

		// Step 3: lock that price as manual → implied 30%
		const r3 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r2.sellUnitPrice,
			effectiveQuantity: qty,
			materialUnitPrice: r2.materialUnitPrice,
			laborUnitPrice: r2.laborUnitPrice,
			currentMarkupMethod: r2.markupMethod,
			hasCustomMarkup: r2.hasCustomMarkup,
		});
		expect(r3.markupPercent).toBeCloseTo(30, 2);
	});

	it("round-trip with fractional markup (12.5%)", () => {
		const r1 = solvePricing({
			changedField: "markup_percent",
			newValue: 12.5,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: true,
		});
		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: qty,
			...cost,
			currentMarkupMethod: r1.markupMethod,
			hasCustomMarkup: true,
		});
		expect(r2.markupPercent).toBeCloseTo(12.5, 2);
	});

	it("Decimal string inputs round-trip correctly", () => {
		const r1 = solvePricing({
			changedField: "markup_percent",
			newValue: "30" as never,
			effectiveQuantity: "100" as never,
			materialUnitPrice: "18.00" as never,
			laborUnitPrice: "7.00" as never,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: true,
		});
		expect(r1.sellUnitPrice).toBeCloseTo(32.5, 4);
	});
});

// ════════════════════════════════════════════════════════════
// Edge cases
// ════════════════════════════════════════════════════════════

describe("solvePricing — edge cases", () => {
	it("zero cost + percentage markup → sell 0 + warning", () => {
		const r = solvePricing({
			changedField: "markup_percent",
			newValue: 30,
			effectiveQuantity: 100,
			materialUnitPrice: 0,
			laborUnitPrice: 0,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBe(0);
		expect(r.warnings.some((w) => w.includes("التكلفة صفر"))).toBe(true);
	});

	it("zero cost + manual_price → sell == manual price (no warning)", () => {
		const r = solvePricing({
			changedField: "manual_unit_price",
			newValue: 50,
			effectiveQuantity: 100,
			materialUnitPrice: 0,
			laborUnitPrice: 0,
			currentMarkupMethod: "manual_price",
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBe(50);
		expect(r.warnings.some((w) => w.includes("التكلفة صفر"))).toBe(false);
	});

	it("zero quantity → sellTotalAmount 0 even with valid sellUnitPrice", () => {
		const r = solvePricing(baseline({
			changedField: "markup_percent",
			newValue: 30,
			effectiveQuantity: 0,
		}));
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4);
		expect(r.sellTotalAmount).toBe(0);
	});

	it("unknown currentMarkupMethod normalized to percentage", () => {
		const r = solvePricing(baseline({
			currentMarkupMethod: "weird" as never,
			changedField: "markup_percent",
			newValue: 30,
		}));
		expect(r.markupMethod).toBe("percentage");
	});
});
