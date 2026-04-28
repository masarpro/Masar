import { describe, it, expect } from "vitest";
import { calculatePricing } from "../../../../modules/unified-quantities/pricing/pricing-calculator";

// قاعدة: مادة 18 + عمالة 7 = 25 ر.س/وحدة (دهان داخلي قياسي)

describe("calculatePricing — percentage markup", () => {
	it("computes 30% markup correctly", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.unitCost).toBe(25);
		expect(r.totalCost).toBe(2500);
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4); // 25 × 1.3
		expect(r.sellTotalAmount).toBeCloseTo(3250, 2);
		expect(r.profitAmount).toBeCloseTo(750, 2);
		// profitPercent = 750/3250 = 23.077% (margin from sell)
		expect(r.profitPercent).toBeCloseTo(23.0769, 2);
		// actualMarkupPercent = 750/2500 = 30% (markup from cost)
		expect(r.actualMarkupPercent).toBeCloseTo(30, 2);
	});

	it("0% markup → sell == cost, no profit", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 0,
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBe(25);
		expect(r.profitAmount).toBe(0);
		expect(r.profitPercent).toBe(0);
	});

	it("negative markup → loss, with warning", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: -10,
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBeCloseTo(22.5, 4);
		expect(r.profitAmount).toBeCloseTo(-250, 2);
		expect(r.warnings.some((w) => w.includes("خسارة"))).toBe(true);
	});
});

describe("calculatePricing — fixed_amount markup", () => {
	it("adds fixed amount per unit", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "fixed_amount",
			markupFixedAmount: 10,
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBe(35); // 25 + 10
		expect(r.sellTotalAmount).toBeCloseTo(3500, 2);
		expect(r.profitAmount).toBeCloseTo(1000, 2); // 10 × 100
	});

	it("0 fixed amount → sell == cost", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "fixed_amount",
			markupFixedAmount: 0,
			hasCustomMarkup: true,
		});
		expect(r.profitAmount).toBe(0);
	});
});

describe("calculatePricing — manual_price markup", () => {
	it("uses manualUnitPrice ignoring cost-based formulas", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "manual_price",
			manualUnitPrice: 50,
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBe(50);
		expect(r.sellTotalAmount).toBeCloseTo(5000, 2);
		expect(r.profitAmount).toBeCloseTo(2500, 2); // (50-25) × 100
	});

	it("warns when manualUnitPrice is 0 and quantity > 0", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "manual_price",
			manualUnitPrice: 0,
			hasCustomMarkup: true,
		});
		expect(r.warnings.some((w) => w.includes("سعر يدوي صفر"))).toBe(true);
	});

	it("manual price below cost → loss + warning", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "manual_price",
			manualUnitPrice: 20, // below cost of 25
			hasCustomMarkup: true,
		});
		expect(r.profitAmount).toBeCloseTo(-500, 2);
		expect(r.warnings.some((w) => w.includes("خسارة"))).toBe(true);
	});
});

describe("calculatePricing — Global vs Custom markup", () => {
	it("hasCustomMarkup=false uses globalMarkupPercent (ignores item markup)", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "manual_price", // ignored
			manualUnitPrice: 999, // ignored
			markupFixedAmount: 999, // ignored
			markupPercent: 999, // ignored
			globalMarkupPercent: 30,
			hasCustomMarkup: false,
		});
		expect(r.effectiveMarkupMethod).toBe("percentage");
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4); // global 30%, not item 999
	});

	it("hasCustomMarkup=true uses item markup, ignores globalMarkupPercent", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 50,
			globalMarkupPercent: 30, // should be ignored
			hasCustomMarkup: true,
		});
		expect(r.sellUnitPrice).toBeCloseTo(37.5, 4); // item 50%, not global 30%
	});

	it("breakdown labels source as 'Global Markup' when hasCustomMarkup=false", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 0,
			globalMarkupPercent: 30,
			hasCustomMarkup: false,
		});
		expect(r.breakdown.some((b) => b.includes("Global Markup"))).toBe(true);
	});

	it("breakdown labels source as 'هامش خاص' when hasCustomMarkup=true", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 50,
			hasCustomMarkup: true,
		});
		expect(r.breakdown.some((b) => b.includes("هامش خاص"))).toBe(true);
	});
});

describe("calculatePricing — edge cases", () => {
	it("zero cost → unitCost=0 + warning", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 0,
			laborUnitPrice: 0,
			markupMethod: "percentage",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.unitCost).toBe(0);
		expect(r.warnings.some((w) => w.includes("التكلفة صفر"))).toBe(true);
	});

	it("zero quantity → totals 0 but unit prices preserved", () => {
		const r = calculatePricing({
			effectiveQuantity: 0,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.unitCost).toBe(25);
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4);
		expect(r.totalCost).toBe(0);
		expect(r.sellTotalAmount).toBe(0);
		expect(r.profitAmount).toBe(0);
	});

	it("negative material price clamped to 0", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: -50,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.unitCost).toBe(7); // labor only
	});

	it("string Decimal inputs work end-to-end", () => {
		const r = calculatePricing({
			effectiveQuantity: "100" as never,
			materialUnitPrice: "18.50" as never,
			laborUnitPrice: "7.25" as never,
			markupMethod: "percentage",
			markupPercent: "30" as never,
			hasCustomMarkup: true,
		});
		expect(r.unitCost).toBeCloseTo(25.75, 4);
		expect(r.sellUnitPrice).toBeCloseTo(33.475, 4);
	});

	it("unknown markupMethod triggers warning + percentage fallback", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "weird_method",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.warnings.some((w) => w.includes("غير معروفة"))).toBe(true);
		expect(r.sellUnitPrice).toBeCloseTo(32.5, 4);
	});

	it("breakdown contains all 5 expected lines for percentage", () => {
		const r = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 30,
			hasCustomMarkup: true,
		});
		expect(r.breakdown.length).toBeGreaterThanOrEqual(5);
		expect(r.breakdown.some((b) => b.includes("تكلفة المادة"))).toBe(true);
		expect(r.breakdown.some((b) => b.includes("صافي الربح"))).toBe(true);
	});

	it("profitPercent (margin) and actualMarkupPercent are different but consistent", () => {
		const r = calculatePricing({
			effectiveQuantity: 1,
			materialUnitPrice: 50,
			laborUnitPrice: 50,
			markupMethod: "percentage",
			markupPercent: 100,
			hasCustomMarkup: true,
		});
		// 100% markup: cost 100 → sell 200, profit 100
		// margin (profit/sell) = 50%, markup (profit/cost) = 100%
		expect(r.profitPercent).toBeCloseTo(50, 2);
		expect(r.actualMarkupPercent).toBeCloseTo(100, 2);
	});
});
