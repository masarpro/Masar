import { describe, it, expect } from "vitest";
import { calculatePricing } from "../../../../modules/unified-quantities/pricing/pricing-calculator";
import { solvePricing } from "../../../../modules/unified-quantities/pricing/bi-directional-solver";
import { aggregateItems } from "../../../../modules/unified-quantities/pricing/study-aggregator";
import { applyVAT } from "../../../../modules/unified-quantities/pricing/vat-applier";

// ════════════════════════════════════════════════════════════
// Integration: forward → reverse → aggregate
// ════════════════════════════════════════════════════════════

describe("Pricing integration — full pipeline", () => {
	it("end-to-end: calculate → solve (override price) → aggregate", () => {
		// Step 1: forward calc with Global 30%
		const calc = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			markupPercent: 30,
			globalMarkupPercent: 30,
			hasCustomMarkup: false,
		});
		expect(calc.sellUnitPrice).toBeCloseTo(32.5, 4);

		// Step 2: user types a custom sell price
		const solved = solvePricing({
			changedField: "sell_unit_price",
			newValue: 40,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: false,
		});
		expect(solved.markupMethod).toBe("manual_price");
		expect(solved.manualUnitPrice).toBeCloseTo(40, 4);
		expect(solved.markupPercent).toBeCloseTo(60, 4); // implied
		expect(solved.hasCustomMarkup).toBe(true);

		// Step 3: aggregate the now-customized item
		const totals = aggregateItems(
			[
				{
					effectiveQuantity: 100,
					materialUnitPrice: 18,
					laborUnitPrice: 7,
					markupMethod: solved.markupMethod,
					manualUnitPrice: solved.manualUnitPrice ?? undefined,
					hasCustomMarkup: solved.hasCustomMarkup,
				},
			],
			30, // global ignored for this custom item
		);
		expect(totals.totalSellAmount).toBeCloseTo(4000, 2);
		expect(totals.totalProfitAmount).toBeCloseTo(1500, 2);
	});

	it("villa scenario: 5 items mixed pricing → totals + VAT", () => {
		// 5 بنود فيلا مختلفة الـ markup
		const items = [
			{
				effectiveQuantity: 200, // دهان داخلي 200 م²
				materialUnitPrice: 18,
				laborUnitPrice: 7,
				markupMethod: "percentage" as const,
				hasCustomMarkup: false,
			},
			{
				effectiveQuantity: 80, // سيراميك أرضي 80 م²
				materialUnitPrice: 35,
				laborUnitPrice: 15,
				markupMethod: "percentage" as const,
				hasCustomMarkup: false,
			},
			{
				effectiveQuantity: 30, // 30 مقبس
				materialUnitPrice: 15,
				laborUnitPrice: 10,
				markupMethod: "fixed_amount" as const,
				markupFixedAmount: 5,
				hasCustomMarkup: true,
			},
			{
				effectiveQuantity: 5, // 5 وحدات تكييف
				materialUnitPrice: 1800,
				laborUnitPrice: 350,
				markupMethod: "manual_price" as const,
				manualUnitPrice: 2700, // مقاول حدّد سعر مخصّص
				hasCustomMarkup: true,
			},
			{
				effectiveQuantity: 6, // 6 أبواب داخلية
				materialUnitPrice: 750,
				laborUnitPrice: 100,
				markupMethod: "percentage" as const,
				markupPercent: 25,
				hasCustomMarkup: true,
			},
		];

		const totals = aggregateItems(items, 30, 15, false);

		// تحقق إجمالي معقول (بدون أرقام دقيقة لأن الحساب ضخم)
		expect(totals.itemCount).toBe(5);
		expect(totals.enabledItemCount).toBe(5);
		expect(totals.totalGrossCost).toBeGreaterThan(15000);
		expect(totals.totalSellAmount).toBeGreaterThan(totals.totalGrossCost);
		expect(totals.totalProfitAmount).toBeGreaterThan(0);

		// VAT 15% applied to total sell
		expect(totals.vat.vatAmount).toBeCloseTo(totals.totalSellAmount * 0.15, 2);
		expect(totals.vat.grossAmount).toBeCloseTo(
			totals.totalSellAmount * 1.15,
			2,
		);
	});

	it("4-step round-trip preserves consistency", () => {
		// Start: cost 25, hasCustom=false (Global 30%)
		const r1 = calculatePricing({
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			markupMethod: "percentage",
			globalMarkupPercent: 30,
			hasCustomMarkup: false,
		});
		// Step 2: user enters manual sell price
		const r2 = solvePricing({
			changedField: "sell_unit_price",
			newValue: r1.sellUnitPrice,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: "percentage",
			hasCustomMarkup: false,
		});
		// implied markup should be 30
		expect(r2.markupPercent).toBeCloseTo(30, 2);
		// Step 3: convert back to percentage with that implied %
		const r3 = solvePricing({
			changedField: "markup_percent",
			newValue: r2.markupPercent ?? 0,
			effectiveQuantity: 100,
			materialUnitPrice: 18,
			laborUnitPrice: 7,
			currentMarkupMethod: r2.markupMethod,
			hasCustomMarkup: r2.hasCustomMarkup,
		});
		expect(r3.sellUnitPrice).toBeCloseTo(r1.sellUnitPrice, 2);
		expect(r3.markupMethod).toBe("percentage");
	});

	it("VAT round-trip on aggregator output", () => {
		const r = aggregateItems(
			[
				{
					effectiveQuantity: 100,
					materialUnitPrice: 50,
					laborUnitPrice: 50,
					markupMethod: "percentage",
					hasCustomMarkup: false,
				},
			],
			30,
		);
		// 100 × 130 = 13,000 sell
		expect(r.totalSellAmount).toBeCloseTo(13000, 2);

		const reSplit = applyVAT(r.vat.grossAmount, 15, true);
		expect(reSplit.netAmount).toBeCloseTo(r.totalSellAmount, 2);
		expect(reSplit.vatAmount).toBeCloseTo(r.vat.vatAmount, 2);
	});
});
