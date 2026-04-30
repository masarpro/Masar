import { describe, it, expect } from "vitest";
import { computeDirectArea } from "../../../../modules/unified-quantities/compute/methods/direct-area";
import { computeLengthOnly } from "../../../../modules/unified-quantities/compute/methods/length-only";
import { computeManual } from "../../../../modules/unified-quantities/compute/methods/manual";
import { computeLumpSum } from "../../../../modules/unified-quantities/compute/methods/lump-sum";

// ════════════════════════════════════════════════════════════
// computeDirectArea
// ════════════════════════════════════════════════════════════

describe("computeDirectArea", () => {
	const baseItem = {
		calculationMethod: "direct_area" as const,
		primaryValue: 100,
		wastagePercent: 0,
	};

	describe("happy path", () => {
		it("returns area as-is when wastage 0 and no openings", () => {
			const r = computeDirectArea({ item: baseItem });
			expect(r.computedQuantity).toBe(100);
			expect(r.effectiveQuantity).toBe(100);
			expect(r.openingsArea).toBe(0);
		});

		it("applies 10% wastage", () => {
			const r = computeDirectArea({
				item: { ...baseItem, wastagePercent: 10 },
			});
			expect(r.computedQuantity).toBe(100);
			expect(r.effectiveQuantity).toBeCloseTo(110, 4);
		});

		it("breakdown.type is direct_area", () => {
			expect(computeDirectArea({ item: baseItem }).breakdown.type).toBe("direct_area");
		});

		it("breakdown.steps contains required info", () => {
			const r = computeDirectArea({ item: baseItem });
			expect(r.breakdown.steps.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("with openings", () => {
		it("deducts openings when deductOpenings=true", () => {
			const r = computeDirectArea({
				item: { ...baseItem, deductOpenings: true },
				openings: [{ computedArea: 5, count: 2 } as never], // 10 deducted
			});
			expect(r.openingsArea).toBe(10);
			expect(r.computedQuantity).toBe(90);
		});

		it("ignores openings when deductOpenings=false", () => {
			const r = computeDirectArea({
				item: { ...baseItem, deductOpenings: false },
				openings: [{ computedArea: 5, count: 2 } as never],
			});
			expect(r.openingsArea).toBe(0);
			expect(r.computedQuantity).toBe(100);
		});

		it("warns when deductOpenings=true but no openings provided", () => {
			const r = computeDirectArea({
				item: { ...baseItem, deductOpenings: true },
			});
			expect(r.warnings.some((w) => w.includes("لم تُعرَّف فتحات"))).toBe(true);
		});

		it("clamps to 0 when openings exceed area", () => {
			const r = computeDirectArea({
				item: { ...baseItem, primaryValue: 5, deductOpenings: true },
				openings: [{ computedArea: 20, count: 1 } as never],
			});
			expect(r.computedQuantity).toBe(0);
		});
	});

	describe("edge cases", () => {
		it("handles 0 area", () => {
			expect(computeDirectArea({ item: { ...baseItem, primaryValue: 0 } }).computedQuantity).toBe(0);
		});

		it("handles missing primaryValue (treats as 0)", () => {
			expect(computeDirectArea({ item: { calculationMethod: "direct_area" } }).computedQuantity).toBe(0);
		});

		it("clamps negative input to 0", () => {
			expect(computeDirectArea({ item: { ...baseItem, primaryValue: -50 } }).computedQuantity).toBe(0);
		});

		it("throws on wastage > 100", () => {
			expect(() => computeDirectArea({ item: { ...baseItem, wastagePercent: 150 } })).toThrow();
		});
	});

	describe("Decimal serialization (string inputs)", () => {
		it("accepts string primaryValue", () => {
			const r = computeDirectArea({
				item: { ...baseItem, primaryValue: "75.5" as never },
			});
			expect(r.computedQuantity).toBeCloseTo(75.5, 4);
		});

		it("accepts string wastagePercent", () => {
			const r = computeDirectArea({
				item: { ...baseItem, wastagePercent: "10" as never },
			});
			expect(r.effectiveQuantity).toBeCloseTo(110, 4);
		});
	});
});

// ════════════════════════════════════════════════════════════
// computeLengthOnly
// ════════════════════════════════════════════════════════════

describe("computeLengthOnly", () => {
	it("returns length as-is with wastage 0", () => {
		expect(
			computeLengthOnly({
				item: { calculationMethod: "length_only", primaryValue: 50, wastagePercent: 0 },
			}).computedQuantity,
		).toBe(50);
	});

	it("applies 10% wastage to a 25m length", () => {
		expect(
			computeLengthOnly({
				item: { calculationMethod: "length_only", primaryValue: 25, wastagePercent: 10 },
			}).effectiveQuantity,
		).toBeCloseTo(27.5, 4);
	});

	it("clamps negative length to 0", () => {
		expect(
			computeLengthOnly({
				item: { calculationMethod: "length_only", primaryValue: -10, wastagePercent: 10 },
			}).computedQuantity,
		).toBe(0);
	});

	it("returns 0 when length is missing", () => {
		expect(computeLengthOnly({ item: { calculationMethod: "length_only" } }).computedQuantity).toBe(0);
	});

	it("breakdown.type is length_only", () => {
		expect(
			computeLengthOnly({
				item: { calculationMethod: "length_only", primaryValue: 10, wastagePercent: 0 },
			}).breakdown.type,
		).toBe("length_only");
	});
});

// ════════════════════════════════════════════════════════════
// computeManual
// ════════════════════════════════════════════════════════════

describe("computeManual", () => {
	it("returns the value as-is (no wastage applied)", () => {
		const r = computeManual({
			item: {
				calculationMethod: "manual",
				primaryValue: 42.5,
				wastagePercent: 25, // ignored in manual
			},
		});
		expect(r.computedQuantity).toBe(42.5);
		expect(r.effectiveQuantity).toBe(42.5); // wastage NOT applied
	});

	it("clamps negative to 0", () => {
		expect(computeManual({ item: { calculationMethod: "manual", primaryValue: -5 } }).computedQuantity).toBe(0);
	});

	it("returns 0 when missing", () => {
		expect(computeManual({ item: { calculationMethod: "manual" } }).computedQuantity).toBe(0);
	});

	it("breakdown.type is manual", () => {
		expect(computeManual({ item: { calculationMethod: "manual", primaryValue: 10 } }).breakdown.type).toBe(
			"manual",
		);
	});
});

// ════════════════════════════════════════════════════════════
// computeLumpSum
// ════════════════════════════════════════════════════════════

describe("computeLumpSum", () => {
	it("always returns 1, regardless of inputs", () => {
		const r = computeLumpSum({
			item: {
				calculationMethod: "lump_sum",
				primaryValue: 999,
				wastagePercent: 50,
			},
		});
		expect(r.computedQuantity).toBe(1);
		expect(r.effectiveQuantity).toBe(1);
		expect(r.openingsArea).toBe(0);
	});

	it("returns 1 even with no inputs", () => {
		expect(computeLumpSum({ item: { calculationMethod: "lump_sum" } }).computedQuantity).toBe(1);
	});

	it("breakdown.type is lump_sum", () => {
		expect(computeLumpSum({ item: { calculationMethod: "lump_sum" } }).breakdown.type).toBe("lump_sum");
	});
});
