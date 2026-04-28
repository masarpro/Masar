import { describe, it, expect } from "vitest";
import { applyPercentageMarkup } from "../../../../modules/unified-quantities/pricing/markup-methods/percentage";
import { applyFixedAmountMarkup } from "../../../../modules/unified-quantities/pricing/markup-methods/fixed-amount";
import { applyManualPriceMarkup } from "../../../../modules/unified-quantities/pricing/markup-methods/manual-price";

// ════════════════════════════════════════════════════════════
// applyPercentageMarkup
// ════════════════════════════════════════════════════════════

describe("applyPercentageMarkup", () => {
	it("returns cost when percent is 0", () => {
		expect(applyPercentageMarkup(100, 0)).toBe(100);
	});

	it("applies 30% as ×1.3", () => {
		expect(applyPercentageMarkup(100, 30)).toBeCloseTo(130, 4);
	});

	it("applies fractional percent (12.5%)", () => {
		expect(applyPercentageMarkup(80, 12.5)).toBeCloseTo(90, 4);
	});

	it("allows negative percent (loss / promo)", () => {
		expect(applyPercentageMarkup(100, -10)).toBeCloseTo(90, 4);
	});

	it("returns 0 for negative cost (defensive)", () => {
		expect(applyPercentageMarkup(-50, 30)).toBe(0);
	});

	it("returns 0 for NaN cost", () => {
		expect(applyPercentageMarkup(NaN, 30)).toBe(0);
	});

	it("returns cost unchanged when percent is NaN", () => {
		expect(applyPercentageMarkup(100, NaN)).toBe(100);
	});
});

// ════════════════════════════════════════════════════════════
// applyFixedAmountMarkup
// ════════════════════════════════════════════════════════════

describe("applyFixedAmountMarkup", () => {
	it("adds fixed amount on top of cost", () => {
		expect(applyFixedAmountMarkup(25, 10)).toBe(35);
	});

	it("returns cost when amount is 0", () => {
		expect(applyFixedAmountMarkup(50, 0)).toBe(50);
	});

	it("allows negative amount (loss)", () => {
		expect(applyFixedAmountMarkup(100, -20)).toBe(80);
	});

	it("returns 0 for negative cost + negative amount", () => {
		expect(applyFixedAmountMarkup(-50, -10)).toBe(0);
	});

	it("returns max(0, fixedAmount) for negative cost + positive amount", () => {
		expect(applyFixedAmountMarkup(-50, 30)).toBe(30);
	});

	it("returns cost when fixedAmount is NaN", () => {
		expect(applyFixedAmountMarkup(50, NaN)).toBe(50);
	});
});

// ════════════════════════════════════════════════════════════
// applyManualPriceMarkup
// ════════════════════════════════════════════════════════════

describe("applyManualPriceMarkup", () => {
	it("returns the value as-is", () => {
		expect(applyManualPriceMarkup(150)).toBe(150);
	});

	it("returns 0 for negative price", () => {
		expect(applyManualPriceMarkup(-50)).toBe(0);
	});

	it("returns 0 for NaN", () => {
		expect(applyManualPriceMarkup(NaN)).toBe(0);
	});

	it("returns 0 for 0 (valid edge — free item)", () => {
		expect(applyManualPriceMarkup(0)).toBe(0);
	});
});
