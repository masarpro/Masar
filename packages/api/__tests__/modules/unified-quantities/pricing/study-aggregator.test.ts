import { describe, it, expect } from "vitest";
import { aggregateItems } from "../../../../modules/unified-quantities/pricing/study-aggregator";
import type { PricedItemSnapshot } from "../../../../modules/unified-quantities/pricing/types";

const item = (overrides: Partial<PricedItemSnapshot> = {}): PricedItemSnapshot => ({
	effectiveQuantity: 100,
	materialUnitPrice: 18,
	laborUnitPrice: 7,
	markupMethod: "percentage",
	markupPercent: 30,
	hasCustomMarkup: false,
	isEnabled: true,
	...overrides,
});

describe("aggregateItems — empty study", () => {
	it("returns zeros for empty array", () => {
		const r = aggregateItems([], 30);
		expect(r.totalMaterialCost).toBe(0);
		expect(r.totalLaborCost).toBe(0);
		expect(r.totalGrossCost).toBe(0);
		expect(r.totalSellAmount).toBe(0);
		expect(r.totalProfitAmount).toBe(0);
		expect(r.totalProfitPercent).toBe(0);
		expect(r.itemCount).toBe(0);
		expect(r.enabledItemCount).toBe(0);
	});

	it("VAT on empty study is also zero", () => {
		const r = aggregateItems([], 30);
		expect(r.vat.netAmount).toBe(0);
		expect(r.vat.vatAmount).toBe(0);
		expect(r.vat.grossAmount).toBe(0);
	});
});

describe("aggregateItems — single item Global Markup", () => {
	it("computes totals using globalMarkupPercent=30 (Global)", () => {
		const r = aggregateItems([item()], 30); // hasCustomMarkup defaults to false
		expect(r.totalMaterialCost).toBeCloseTo(1800, 2); // 18 × 100
		expect(r.totalLaborCost).toBeCloseTo(700, 2); // 7 × 100
		expect(r.totalGrossCost).toBeCloseTo(2500, 2);
		expect(r.totalSellAmount).toBeCloseTo(3250, 2); // 25 × 1.3 × 100
		expect(r.totalProfitAmount).toBeCloseTo(750, 2);
		expect(r.totalProfitPercent).toBeCloseTo(23.0769, 2);
		expect(r.enabledItemCount).toBe(1);
	});
});

describe("aggregateItems — multiple items mixing Global + Custom", () => {
	it("Global 30% + 1 Custom 50% — verify mixed application", () => {
		const r = aggregateItems(
			[
				item({ hasCustomMarkup: false }), // uses Global 30% → sell 3250
				item({
					hasCustomMarkup: true,
					markupMethod: "percentage",
					markupPercent: 50,
					// uses Custom 50% → 25 × 1.5 × 100 = 3750
				}),
			],
			30,
		);
		expect(r.totalGrossCost).toBeCloseTo(5000, 2);
		expect(r.totalSellAmount).toBeCloseTo(7000, 2); // 3250 + 3750
		expect(r.totalProfitAmount).toBeCloseTo(2000, 2);
	});

	it("disabled items are excluded from totals", () => {
		const r = aggregateItems(
			[
				item({ isEnabled: true }),
				item({ isEnabled: false, materialUnitPrice: 999 }), // ignored
				item({ isEnabled: true }),
			],
			30,
		);
		expect(r.itemCount).toBe(3);
		expect(r.enabledItemCount).toBe(2);
		expect(r.totalGrossCost).toBeCloseTo(5000, 2); // 2 × 2500
	});

	it("undefined isEnabled treated as enabled (default)", () => {
		const i = item();
		delete (i as Partial<PricedItemSnapshot>).isEnabled;
		const r = aggregateItems([i], 30);
		expect(r.enabledItemCount).toBe(1);
	});
});

describe("aggregateItems — items without prices", () => {
	it("zero-cost item still counted but contributes 0 sell", () => {
		const r = aggregateItems(
			[
				item(),
				item({ materialUnitPrice: 0, laborUnitPrice: 0 }),
			],
			30,
		);
		// First item: gross 2500, sell 3250
		// Second item: gross 0, sell 0 (cost-based markup of 0)
		expect(r.totalGrossCost).toBeCloseTo(2500, 2);
		expect(r.totalSellAmount).toBeCloseTo(3250, 2);
		expect(r.enabledItemCount).toBe(2);
	});

	it("manual_price item with zero cost still contributes its price", () => {
		const r = aggregateItems(
			[
				item({
					materialUnitPrice: 0,
					laborUnitPrice: 0,
					hasCustomMarkup: true,
					markupMethod: "manual_price",
					manualUnitPrice: 50,
				}),
			],
			30,
		);
		expect(r.totalGrossCost).toBe(0);
		expect(r.totalSellAmount).toBeCloseTo(5000, 2); // 50 × 100
		expect(r.totalProfitAmount).toBeCloseTo(5000, 2); // pure profit
	});
});

describe("aggregateItems — VAT", () => {
	it("VAT excluded (default): adds 15% to totalSellAmount", () => {
		const r = aggregateItems([item()], 30, 15, false);
		expect(r.totalSellAmount).toBeCloseTo(3250, 2);
		expect(r.vat.netAmount).toBeCloseTo(3250, 2);
		expect(r.vat.vatAmount).toBeCloseTo(487.5, 2);
		expect(r.vat.grossAmount).toBeCloseTo(3737.5, 2);
	});

	it("VAT included: extracts net from sellAmount", () => {
		const r = aggregateItems([item()], 30, 15, true);
		// totalSellAmount = 3250 (already-included)
		// net = 3250 / 1.15 = 2826.0869…
		// vat = 423.913…
		expect(r.vat.grossAmount).toBeCloseTo(3250, 2);
		expect(r.vat.netAmount).toBeCloseTo(2826.09, 2);
		expect(r.vat.vatAmount).toBeCloseTo(423.91, 2);
	});

	it("VAT 0% leaves amounts unchanged", () => {
		const r = aggregateItems([item()], 30, 0, false);
		expect(r.vat.netAmount).toBeCloseTo(3250, 2);
		expect(r.vat.vatAmount).toBe(0);
		expect(r.vat.grossAmount).toBeCloseTo(3250, 2);
	});
});

describe("aggregateItems — edge cases", () => {
	it("100 items performance sanity: completes synchronously", () => {
		const items = Array.from({ length: 100 }, () => item());
		const start = Date.now();
		const r = aggregateItems(items, 30);
		const duration = Date.now() - start;
		expect(r.itemCount).toBe(100);
		expect(r.totalGrossCost).toBeCloseTo(250_000, 2);
		expect(duration).toBeLessThan(100); // should be near-instant
	});

	it("string Decimal inputs from Prisma serialization", () => {
		const r = aggregateItems(
			[
				item({
					effectiveQuantity: "100" as never,
					materialUnitPrice: "18.50" as never,
					laborUnitPrice: "7.25" as never,
					markupPercent: "30" as never,
				}),
			],
			30,
		);
		expect(r.totalGrossCost).toBeCloseTo(2575, 2); // 25.75 × 100
	});

	it("hasCustomMarkup=true with custom % overrides Global", () => {
		const r = aggregateItems(
			[
				item({
					hasCustomMarkup: true,
					markupMethod: "percentage",
					markupPercent: 100,
				}),
			],
			30, // global ignored for this item
		);
		expect(r.totalSellAmount).toBeCloseTo(5000, 2); // 25 × 2 × 100
	});

	it("totalProfitPercent reflects margin not markup", () => {
		// 50% margin = 100% markup (unitCost=25, sell=50)
		const r = aggregateItems(
			[
				item({
					hasCustomMarkup: true,
					markupMethod: "manual_price",
					manualUnitPrice: 50,
				}),
			],
			30,
		);
		expect(r.totalProfitPercent).toBeCloseTo(50, 2);
	});
});
