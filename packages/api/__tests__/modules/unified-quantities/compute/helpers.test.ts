import { describe, it, expect } from "vitest";
import {
	shoelaceArea,
	polygonPerimeter,
	validatePolygon,
} from "../../../../modules/unified-quantities/compute/helpers/polygon-helper";
import {
	calculateOpeningsArea,
	calculateExteriorOpeningsArea,
} from "../../../../modules/unified-quantities/compute/helpers/openings-deductor";
import { applyWastage } from "../../../../modules/unified-quantities/compute/helpers/wastage-applier";
import { resolveLinkedQuantity } from "../../../../modules/unified-quantities/compute/helpers/link-resolver";

// ════════════════════════════════════════════════════════════
// shoelaceArea / polygonPerimeter / validatePolygon
// ════════════════════════════════════════════════════════════

describe("shoelaceArea", () => {
	it("returns 0 for less than 3 points", () => {
		expect(shoelaceArea([])).toBe(0);
		expect(shoelaceArea([{ x: 0, y: 0 }])).toBe(0);
		expect(shoelaceArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
	});

	it("computes area of a 10×10 square", () => {
		expect(
			shoelaceArea([
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
				{ x: 0, y: 10 },
			]),
		).toBe(100);
	});

	it("computes area of a triangle (base 10, height 10)", () => {
		expect(
			shoelaceArea([
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 0, y: 10 },
			]),
		).toBe(50);
	});

	it("treats clockwise and counter-clockwise rotation identically", () => {
		const ccw = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
		];
		const cw = [...ccw].reverse();
		expect(shoelaceArea(ccw)).toBe(shoelaceArea(cw));
	});

	it("computes area of an L-shape (irregular polygon)", () => {
		// L-shape: 10x10 square with 4x4 cut from top-right
		// area = 100 - 16 = 84
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 6 },
			{ x: 6, y: 6 },
			{ x: 6, y: 10 },
			{ x: 0, y: 10 },
		];
		expect(shoelaceArea(points)).toBe(84);
	});

	it("ignores invalid input (non-array)", () => {
		expect(shoelaceArea(null as never)).toBe(0);
		expect(shoelaceArea(undefined as never)).toBe(0);
	});
});

describe("polygonPerimeter", () => {
	it("returns 0 for less than 2 points", () => {
		expect(polygonPerimeter([])).toBe(0);
		expect(polygonPerimeter([{ x: 0, y: 0 }])).toBe(0);
	});

	it("computes perimeter of 10×10 square as 40", () => {
		expect(
			polygonPerimeter([
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
				{ x: 0, y: 10 },
			]),
		).toBe(40);
	});

	it("computes perimeter of 3-4-5 triangle as 12", () => {
		expect(
			polygonPerimeter([
				{ x: 0, y: 0 },
				{ x: 3, y: 0 },
				{ x: 0, y: 4 },
			]),
		).toBeCloseTo(12, 6);
	});
});

describe("validatePolygon", () => {
	it("returns true for valid polygon", () => {
		expect(
			validatePolygon([
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 0, y: 1 },
			]),
		).toBe(true);
	});

	it("rejects non-arrays and short arrays", () => {
		expect(validatePolygon(null)).toBe(false);
		expect(validatePolygon("polygon")).toBe(false);
		expect(validatePolygon([])).toBe(false);
		expect(validatePolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
	});

	it("rejects missing x/y or non-finite values", () => {
		expect(
			validatePolygon([
				{ x: 0, y: 0 },
				{ x: NaN, y: 0 },
				{ x: 1, y: 1 },
			]),
		).toBe(false);
		expect(
			validatePolygon([
				{ x: 0, y: 0 },
				{ a: 1, b: 1 },
				{ x: 0, y: 1 },
			]),
		).toBe(false);
	});
});

// ════════════════════════════════════════════════════════════
// calculateOpeningsArea / calculateExteriorOpeningsArea
// ════════════════════════════════════════════════════════════

describe("calculateOpeningsArea", () => {
	it("returns 0 for empty/null input", () => {
		expect(calculateOpeningsArea([])).toBe(0);
		expect(calculateOpeningsArea(null)).toBe(0);
		expect(calculateOpeningsArea(undefined)).toBe(0);
	});

	it("sums area × count for openings that deduct (default true)", () => {
		// 2 doors of 0.9×2.1 + 1 window of 1.5×1.2 = 2*1.89 + 1.8 = 5.58
		const result = calculateOpeningsArea([
			{ computedArea: 1.89, count: 2 } as never,
			{ computedArea: 1.8, count: 1 } as never,
		]);
		expect(result).toBeCloseTo(5.58, 4);
	});

	it("excludes openings with deductFromInteriorFinishes=false", () => {
		const result = calculateOpeningsArea([
			{ computedArea: 2, count: 1, deductFromInteriorFinishes: true },
			{ computedArea: 5, count: 1, deductFromInteriorFinishes: false },
		]);
		expect(result).toBe(2);
	});

	it("handles string inputs (Decimal serialization)", () => {
		const result = calculateOpeningsArea([
			{ computedArea: "1.5" as never, count: 2 },
		]);
		expect(result).toBe(3);
	});

	it("treats undefined deductFromInteriorFinishes as true (deduct)", () => {
		expect(
			calculateOpeningsArea([
				{ computedArea: 2, count: 1 } as never, // no flag
			]),
		).toBe(2);
	});
});

describe("calculateExteriorOpeningsArea", () => {
	it("filters by isExterior=true only", () => {
		const result = calculateExteriorOpeningsArea([
			{ computedArea: 2, count: 1, isExterior: true },
			{ computedArea: 3, count: 1, isExterior: false },
			{ computedArea: 1, count: 1 } as never, // missing flag = not exterior
		]);
		expect(result).toBe(2);
	});

	it("returns 0 for empty/null/undefined input", () => {
		expect(calculateExteriorOpeningsArea([])).toBe(0);
		expect(calculateExteriorOpeningsArea(null)).toBe(0);
		expect(calculateExteriorOpeningsArea(undefined)).toBe(0);
	});
});

// ════════════════════════════════════════════════════════════
// applyWastage
// ════════════════════════════════════════════════════════════

describe("applyWastage", () => {
	it("returns same value when wastage is 0", () => {
		expect(applyWastage(100, 0)).toBe(100);
	});

	it("applies 10% wastage as ×1.1", () => {
		expect(applyWastage(100, 10)).toBeCloseTo(110, 6);
	});

	it("applies max 100% wastage as ×2", () => {
		expect(applyWastage(50, 100)).toBe(100);
	});

	it("throws on negative wastage", () => {
		expect(() => applyWastage(100, -5)).toThrow(/يجب أن تكون بين 0 و 100/);
	});

	it("throws on wastage > 100", () => {
		expect(() => applyWastage(100, 101)).toThrow();
	});

	it("throws on NaN wastage", () => {
		expect(() => applyWastage(100, NaN)).toThrow();
	});

	it("returns 0 for negative quantity (defensive)", () => {
		expect(applyWastage(-50, 10)).toBe(0);
	});

	it("returns 0 for NaN quantity (defensive)", () => {
		expect(applyWastage(NaN, 10)).toBe(0);
	});
});

// ════════════════════════════════════════════════════════════
// resolveLinkedQuantity (3 formulas)
// ════════════════════════════════════════════════════════════

describe("resolveLinkedQuantity", () => {
	const baseInput = (overrides: Record<string, unknown> = {}) => ({
		item: {
			calculationMethod: "direct_area" as const,
			linkedFromItemId: "item-1",
			linkQuantityFormula: "SAME" as const,
			wastagePercent: 0,
			...overrides,
		},
		linkedFromItem: { effectiveQuantity: 100 },
	});

	describe("SAME formula", () => {
		it("returns the same effectiveQuantity from source", () => {
			const result = resolveLinkedQuantity(baseInput() as never);
			expect(result.computedQuantity).toBe(100);
			expect(result.effectiveQuantity).toBe(100);
		});

		it("applies wastage on top of SAME", () => {
			const result = resolveLinkedQuantity(
				baseInput({ wastagePercent: 10 }) as never,
			);
			expect(result.computedQuantity).toBe(100);
			expect(result.effectiveQuantity).toBe(110);
		});

		it("falls back to computedQuantity if effectiveQuantity missing", () => {
			const result = resolveLinkedQuantity({
				...baseInput(),
				linkedFromItem: { computedQuantity: 80 },
			} as never);
			expect(result.computedQuantity).toBe(80);
		});

		it("returns 0 when source is missing", () => {
			const result = resolveLinkedQuantity({
				...baseInput(),
				linkedFromItem: null,
			} as never);
			expect(result.computedQuantity).toBe(0);
		});
	});

	describe("MINUS_WET_AREAS formula", () => {
		it("subtracts wet space wall area from source", () => {
			// لياسة 100 م²، مطبخ بجدران 15 م² (wet) → 85
			const result = resolveLinkedQuantity({
				item: {
					calculationMethod: "direct_area",
					linkedFromItemId: "plaster-1",
					linkQuantityFormula: "MINUS_WET_AREAS",
					wastagePercent: 0,
				},
				linkedFromItem: { effectiveQuantity: 100 },
				context: {
					spaces: [
						{ isWetArea: true, computedWallArea: 15 },
						{ isWetArea: false, computedWallArea: 30 }, // ignored
					],
				},
			});
			expect(result.computedQuantity).toBe(85);
		});

		it("ignores spaces without isWetArea", () => {
			const result = resolveLinkedQuantity({
				item: {
					calculationMethod: "direct_area",
					linkQuantityFormula: "MINUS_WET_AREAS",
					wastagePercent: 0,
				},
				linkedFromItem: { effectiveQuantity: 100 },
				context: {
					spaces: [
						{ computedWallArea: 20 } as never, // no isWetArea
					],
				},
			});
			expect(result.computedQuantity).toBe(100);
		});

		it("clamps to 0 when wet area > source", () => {
			const result = resolveLinkedQuantity({
				item: {
					calculationMethod: "direct_area",
					linkQuantityFormula: "MINUS_WET_AREAS",
					wastagePercent: 0,
				},
				linkedFromItem: { effectiveQuantity: 50 },
				context: {
					spaces: [{ isWetArea: true, computedWallArea: 80 }],
				},
			});
			expect(result.computedQuantity).toBe(0);
			expect(result.warnings.some((w) => w.includes("الرطبة أكبر"))).toBe(true);
		});

		it("integration: paint linked from plaster with wet area + 10% wastage", () => {
			// لياسة داخلية 100 م² + مطبخ 15 م² (wet wall area)
			// دهان مرتبط MINUS_WET_AREAS بهدر 10%
			// المتوقع: 100 - 15 = 85 → ×1.10 = 93.5
			const result = resolveLinkedQuantity({
				item: {
					calculationMethod: "direct_area",
					linkQuantityFormula: "MINUS_WET_AREAS",
					wastagePercent: 10,
				},
				linkedFromItem: { effectiveQuantity: 100 },
				context: {
					spaces: [{ isWetArea: true, computedWallArea: 15 }],
				},
			});
			expect(result.computedQuantity).toBe(85);
			expect(result.effectiveQuantity).toBeCloseTo(93.5, 4);
		});
	});

	describe("PLUS_PERCENT formula", () => {
		it("adds percent on top of source", () => {
			// 100 + 5% = 105
			const result = resolveLinkedQuantity(
				baseInput({
					linkQuantityFormula: "PLUS_PERCENT",
					linkPercentValue: 5,
				}) as never,
			);
			expect(result.computedQuantity).toBe(105);
		});

		it("0% returns same as SAME", () => {
			const result = resolveLinkedQuantity(
				baseInput({
					linkQuantityFormula: "PLUS_PERCENT",
					linkPercentValue: 0,
				}) as never,
			);
			expect(result.computedQuantity).toBe(100);
		});

		it("applies wastage after PLUS_PERCENT", () => {
			// 100 +10% = 110 ×1.10 = 121
			const result = resolveLinkedQuantity(
				baseInput({
					linkQuantityFormula: "PLUS_PERCENT",
					linkPercentValue: 10,
					wastagePercent: 10,
				}) as never,
			);
			expect(result.effectiveQuantity).toBeCloseTo(121, 4);
		});
	});

	it("falls back to SAME and warns on unknown formula", () => {
		const result = resolveLinkedQuantity({
			item: {
				calculationMethod: "direct_area",
				linkQuantityFormula: "UNKNOWN_FORMULA",
				wastagePercent: 0,
			},
			linkedFromItem: { effectiveQuantity: 100 },
		});
		expect(result.computedQuantity).toBe(100);
		expect(result.warnings.some((w) => w.includes("UNKNOWN_FORMULA"))).toBe(true);
	});

	it("breakdown includes formula type", () => {
		const result = resolveLinkedQuantity(baseInput() as never);
		expect(result.breakdown.type).toBe("linked:SAME");
		expect(result.breakdown.steps.length).toBeGreaterThan(0);
	});
});
