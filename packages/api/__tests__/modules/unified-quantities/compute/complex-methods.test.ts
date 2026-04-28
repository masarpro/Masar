import { describe, it, expect } from "vitest";
import { computeLengthXHeight } from "../../../../modules/unified-quantities/compute/methods/length-x-height";
import { computePerUnit } from "../../../../modules/unified-quantities/compute/methods/per-unit";
import { computePerRoom } from "../../../../modules/unified-quantities/compute/methods/per-room";
import { computePolygon } from "../../../../modules/unified-quantities/compute/methods/polygon";

// ════════════════════════════════════════════════════════════
// computeLengthXHeight
// ════════════════════════════════════════════════════════════

describe("computeLengthXHeight", () => {
	const baseItem = {
		calculationMethod: "length_x_height" as const,
		primaryValue: 10,
		secondaryValue: 3,
		wastagePercent: 0,
	};

	describe("happy path", () => {
		it("computes simple area without openings or wastage", () => {
			const r = computeLengthXHeight({ item: baseItem });
			expect(r.computedQuantity).toBe(30);
			expect(r.effectiveQuantity).toBe(30);
			expect(r.openingsArea).toBe(0);
		});

		it("applies 10% wastage", () => {
			const r = computeLengthXHeight({ item: { ...baseItem, wastagePercent: 10 } });
			expect(r.computedQuantity).toBe(30);
			expect(r.effectiveQuantity).toBeCloseTo(33, 4);
		});

		it("breakdown.type is length_x_height", () => {
			expect(computeLengthXHeight({ item: baseItem }).breakdown.type).toBe("length_x_height");
		});
	});

	describe("with openings", () => {
		it("deducts opening area when deductOpenings=true", () => {
			const r = computeLengthXHeight({
				item: { ...baseItem, deductOpenings: true },
				openings: [{ computedArea: 2, count: 2 } as never], // 4 m²
			});
			expect(r.openingsArea).toBe(4);
			expect(r.computedQuantity).toBe(26);
		});

		it("clamps to 0 when openings exceed gross area", () => {
			const r = computeLengthXHeight({
				item: { ...baseItem, primaryValue: 5, secondaryValue: 1, deductOpenings: true },
				openings: [{ computedArea: 20, count: 1 } as never],
			});
			expect(r.computedQuantity).toBe(0);
		});

		it("warns when deductOpenings=true but no openings provided", () => {
			const r = computeLengthXHeight({ item: { ...baseItem, deductOpenings: true } });
			expect(r.warnings.some((w) => w.includes("لم تُعرَّف فتحات"))).toBe(true);
		});

		it("excludes openings flagged deductFromInteriorFinishes=false", () => {
			const r = computeLengthXHeight({
				item: { ...baseItem, deductOpenings: true },
				openings: [
					{ computedArea: 2, count: 1, deductFromInteriorFinishes: true },
					{ computedArea: 5, count: 1, deductFromInteriorFinishes: false },
				],
			});
			expect(r.openingsArea).toBe(2);
			expect(r.computedQuantity).toBe(28);
		});
	});

	describe("edge cases", () => {
		it("zero length returns 0", () => {
			expect(
				computeLengthXHeight({ item: { ...baseItem, primaryValue: 0 } }).computedQuantity,
			).toBe(0);
		});

		it("negative length is clamped to 0", () => {
			expect(
				computeLengthXHeight({ item: { ...baseItem, primaryValue: -10 } }).computedQuantity,
			).toBe(0);
		});

		it("missing height treats as 0", () => {
			const r = computeLengthXHeight({
				item: { calculationMethod: "length_x_height", primaryValue: 10 },
			});
			expect(r.computedQuantity).toBe(0);
		});
	});

	describe("Decimal serialization", () => {
		it("accepts string primary/secondary", () => {
			const r = computeLengthXHeight({
				item: {
					calculationMethod: "length_x_height",
					primaryValue: "10.5" as never,
					secondaryValue: "3.2" as never,
					wastagePercent: "10" as never,
				},
			});
			expect(r.computedQuantity).toBeCloseTo(33.6, 4);
			expect(r.effectiveQuantity).toBeCloseTo(36.96, 4);
		});
	});
});

// ════════════════════════════════════════════════════════════
// computePerUnit
// ════════════════════════════════════════════════════════════

describe("computePerUnit", () => {
	const base = (count: number | string, wastage = 0) => ({
		item: {
			calculationMethod: "per_unit" as const,
			primaryValue: count as never,
			wastagePercent: wastage,
		},
	});

	it("returns count as-is with no wastage", () => {
		const r = computePerUnit(base(15));
		expect(r.computedQuantity).toBe(15);
		expect(r.effectiveQuantity).toBe(15);
	});

	it("applies wastage when > 0", () => {
		const r = computePerUnit(base(20, 5));
		expect(r.computedQuantity).toBe(20);
		expect(r.effectiveQuantity).toBeCloseTo(21, 4);
	});

	it("clamps negative count to 0", () => {
		expect(computePerUnit(base(-5)).computedQuantity).toBe(0);
	});

	it("returns 0 for missing input", () => {
		expect(
			computePerUnit({ item: { calculationMethod: "per_unit" } }).computedQuantity,
		).toBe(0);
	});

	it("accepts string input", () => {
		expect(computePerUnit(base("12.5")).computedQuantity).toBe(12.5);
	});

	it("breakdown.type is per_unit", () => {
		expect(computePerUnit(base(1)).breakdown.type).toBe("per_unit");
	});
});

// ════════════════════════════════════════════════════════════
// computePerRoom
// ════════════════════════════════════════════════════════════

describe("computePerRoom", () => {
	it("multiplies countPerRoom × explicit roomsCount", () => {
		// 4 مقابس × 5 غرف = 20
		const r = computePerRoom({
			item: {
				calculationMethod: "per_room",
				primaryValue: 4,
				secondaryValue: 5,
				wastagePercent: 0,
			},
		});
		expect(r.computedQuantity).toBe(20);
	});

	it("applies wastage when > 0", () => {
		const r = computePerRoom({
			item: {
				calculationMethod: "per_room",
				primaryValue: 4,
				secondaryValue: 5,
				wastagePercent: 10,
			},
		});
		expect(r.effectiveQuantity).toBeCloseTo(22, 4);
	});

	it("falls back to context.spaces.length when secondaryValue missing", () => {
		const r = computePerRoom({
			item: { calculationMethod: "per_room", primaryValue: 3 },
			context: {
				spaces: [
					{ isWetArea: false } as never,
					{ isWetArea: false } as never,
					{ isWetArea: true } as never,
				],
			},
		});
		expect(r.computedQuantity).toBe(9); // 3 × 3
	});

	it("falls back to 0 rooms when no context", () => {
		expect(
			computePerRoom({
				item: { calculationMethod: "per_room", primaryValue: 5 },
			}).computedQuantity,
		).toBe(0);
	});

	it("clamps negative inputs to 0", () => {
		expect(
			computePerRoom({
				item: {
					calculationMethod: "per_room",
					primaryValue: -2,
					secondaryValue: 5,
				},
			}).computedQuantity,
		).toBe(0);
	});

	it("breakdown notes 'مأخوذ من السياق' when fallback used", () => {
		const r = computePerRoom({
			item: { calculationMethod: "per_room", primaryValue: 3 },
			context: { spaces: [{} as never, {} as never] },
		});
		expect(r.breakdown.steps.some((s) => s.includes("مأخوذ من السياق"))).toBe(true);
	});
});

// ════════════════════════════════════════════════════════════
// computePolygon
// ════════════════════════════════════════════════════════════

describe("computePolygon", () => {
	const square10 = [
		{ x: 0, y: 0 },
		{ x: 10, y: 0 },
		{ x: 10, y: 10 },
		{ x: 0, y: 10 },
	];

	describe("happy path", () => {
		it("computes square 10×10 area = 100", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: square10,
					wastagePercent: 0,
				},
			});
			expect(r.computedQuantity).toBe(100);
		});

		it("applies wastage to polygon area", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: square10,
					wastagePercent: 10,
				},
			});
			expect(r.effectiveQuantity).toBeCloseTo(110, 4);
		});

		it("computes L-shape area = 84", () => {
			const lShape = [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 6 },
				{ x: 6, y: 6 },
				{ x: 6, y: 10 },
				{ x: 0, y: 10 },
			];
			expect(
				computePolygon({
					item: {
						calculationMethod: "polygon",
						polygonPoints: lShape,
						wastagePercent: 0,
					},
				}).computedQuantity,
			).toBe(84);
		});
	});

	describe("with openings", () => {
		it("deducts openings from polygon area", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: square10,
					wastagePercent: 0,
					deductOpenings: true,
				},
				openings: [{ computedArea: 5, count: 2 } as never], // 10 deducted
			});
			expect(r.computedQuantity).toBe(90);
			expect(r.openingsArea).toBe(10);
		});
	});

	describe("edge cases", () => {
		it("warns and returns 0 for invalid polygon (2 points)", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
					wastagePercent: 0,
				},
			});
			expect(r.computedQuantity).toBe(0);
			expect(r.warnings.some((w) => w.includes("غير صالحة"))).toBe(true);
		});

		it("warns and returns 0 for missing polygonPoints", () => {
			const r = computePolygon({
				item: { calculationMethod: "polygon", wastagePercent: 0 },
			});
			expect(r.computedQuantity).toBe(0);
		});

		it("warns and returns 0 for non-array polygonPoints", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: "not an array" as never,
					wastagePercent: 0,
				},
			});
			expect(r.computedQuantity).toBe(0);
		});

		it("rejects polygon with NaN coordinate", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: [
						{ x: 0, y: 0 },
						{ x: NaN, y: 0 },
						{ x: 10, y: 10 },
					],
					wastagePercent: 0,
				},
			});
			expect(r.computedQuantity).toBe(0);
		});

		it("warns when deductOpenings=true but no openings provided", () => {
			const r = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: square10,
					wastagePercent: 0,
					deductOpenings: true,
				},
			});
			expect(r.computedQuantity).toBe(100);
			expect(r.warnings.some((w) => w.includes("لم تُعرَّف فتحات"))).toBe(true);
		});

		it("clockwise polygon returns same area as counter-clockwise", () => {
			const r1 = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: square10,
					wastagePercent: 0,
				},
			}).computedQuantity;
			const r2 = computePolygon({
				item: {
					calculationMethod: "polygon",
					polygonPoints: [...square10].reverse(),
					wastagePercent: 0,
				},
			}).computedQuantity;
			expect(r1).toBe(r2);
		});
	});
});
