import { describe, it, expect } from "vitest";
import {
	getRebarWeightPerMeter,
	calculateBarCount,
	calculateBarLength,
	calculateIsolatedFoundation,
	calculateCombinedFoundation,
	calculateRaftFoundation,
	calculateColumnRebar,
	calculateBeamRebar,
	calculateStaircaseRebar,
	calculateSolidSlab,
	calculateRibbedSlab,
} from "../structural-calculations";
import { calculateStairs, calculateFoundation } from "../calculations";
import { calculateOtherStructural } from "../other-structural-calculations";

// ─── Helper tests ───

describe("getRebarWeightPerMeter", () => {
	it("returns known weight for T12", () => {
		const w = getRebarWeightPerMeter(12);
		expect(w).toBeCloseTo(0.888, 2);
	});

	it("returns known weight for T16", () => {
		const w = getRebarWeightPerMeter(16);
		expect(w).toBeCloseTo(1.58, 1);
	});

	it("falls back to formula for unknown diameter", () => {
		const w = getRebarWeightPerMeter(99);
		expect(w).toBeCloseTo(99 * 99 * 0.00617, 2);
	});
});

describe("calculateBarCount", () => {
	it("returns correct count for 6m at 200mm spacing", () => {
		// 6000/200 + 1 = 31
		expect(calculateBarCount(6, 0.2)).toBe(31);
	});

	it("returns 0 when spacing is 0", () => {
		expect(calculateBarCount(6, 0)).toBe(0);
	});
});

describe("calculateBarLength", () => {
	it("adds anchorage and lap", () => {
		expect(calculateBarLength(5, 0.3, 0.5, 0)).toBe(5.8);
	});
});

// ─── Foundation tests ───

describe("calculateIsolatedFoundation", () => {
	it("computes concrete volume for 1.5x1.5x0.6 foundation", () => {
		const result = calculateIsolatedFoundation({
			length: 1.5,
			width: 1.5,
			height: 0.6,
			cover: 0.05,
			hookLength: 0.1,
			quantity: 4,
			bottomShort: { diameter: 16, barsPerMeter: 7 },
			bottomLong: { diameter: 16, barsPerMeter: 7 },
		});

		// Volume = 1.5 * 1.5 * 0.6 * 4 = 5.4
		expect(result.concreteVolume).toBeCloseTo(5.4, 1);
		expect(result.rebarDetails.length).toBeGreaterThan(0);
		expect(result.totals.grossWeight).toBeGreaterThan(0);
	});
});

// ─── Column Rebar tests ───

describe("calculateColumnRebar", () => {
	it("computes concrete volume and rebar for a typical column", () => {
		const result = calculateColumnRebar({
			quantity: 4,
			width: 30,
			depth: 30,
			height: 3,
			mainBarsCount: 8,
			mainBarDiameter: 16,
			stirrupDiameter: 8,
			stirrupSpacing: 150,
			concreteType: "C35",
		});

		// Concrete = (0.3 * 0.3 * 3) * 4 = 1.08
		expect(result.concreteVolume).toBeCloseTo(1.08, 1);
		expect(result.cuttingDetails).toHaveLength(2);
		expect(result.cuttingDetails[0].description).toBe("حديد رئيسي");
		expect(result.cuttingDetails[1].description).toBe("كانات");
		expect(result.totals.grossWeight).toBeGreaterThan(0);
		expect(result.totals.wastePercentage).toBeGreaterThanOrEqual(0);
	});
});

// ─── Beam Rebar tests ───

describe("calculateBeamRebar", () => {
	it("computes concrete volume and cutting details for a beam", () => {
		const result = calculateBeamRebar({
			quantity: 2,
			width: 30,
			height: 60,
			length: 5,
			topBarsCount: 3,
			topBarDiameter: 16,
			bottomBarsCount: 4,
			bottomBarDiameter: 18,
			stirrupDiameter: 8,
			stirrupSpacing: 150,
			concreteType: "C30",
		});

		// Concrete = (0.3 * 0.6 * 5) * 2 = 1.8
		expect(result.concreteVolume).toBeCloseTo(1.8, 1);
		expect(result.cuttingDetails).toHaveLength(3);
		expect(result.cuttingDetails[0].description).toBe("حديد علوي");
		expect(result.cuttingDetails[1].description).toBe("حديد سفلي");
		expect(result.cuttingDetails[2].description).toBe("كانات");
		expect(result.totals.grossWeight).toBeGreaterThan(result.totals.netWeight);
	});
});

// ─── Staircase Rebar tests ───

describe("calculateStaircaseRebar", () => {
	it("computes 4 cutting layers for a staircase", () => {
		const result = calculateStaircaseRebar({
			width: 1.2,
			flightLength: 3,
			landingLength: 1.5,
			landingWidth: 1.2,
			thickness: 15,
			risersCount: 10,
			riserHeight: 17,
			treadDepth: 28,
			mainBarDiameter: 14,
			mainBarsPerMeter: 7,
			secondaryBarDiameter: 10,
			secondaryBarsPerMeter: 5,
			concreteType: "C30",
		});

		expect(result.cuttingDetails).toHaveLength(4);
		expect(result.cuttingDetails[0].description).toContain("سفلي رئيسي");
		expect(result.cuttingDetails[1].description).toContain("سفلي ثانوي");
		expect(result.cuttingDetails[2].description).toContain("علوي رئيسي");
		expect(result.cuttingDetails[3].description).toContain("علوي ثانوي");
		expect(result.totals.grossWeight).toBeGreaterThan(0);
		expect(result.concreteVolume).toBeGreaterThan(0);
	});
});

// ─── Slab tests ───

describe("calculateSolidSlab", () => {
	it("calculates concrete volume for a 6x5m solid slab", () => {
		const result = calculateSolidSlab({
			id: "test-1",
			name: "سقف صلب",
			type: "solid",
			subType: "two_way",
			floorName: "أرضي",
			quantity: 1,
			isComplete: false,
			dimensions: { length: 6, width: 5, grossArea: 30 },
			openings: [],
			thickness: 0.15,
			reinforcement: {
				inputMethod: "grid",
				grid: {
					bottom: {
						xDirection: { diameter: 12, spacing: 0.15 },
						yDirection: { diameter: 10, spacing: 0.2 },
					},
				},
			},
		});

		// Volume = 6 * 5 * 0.15 * 1 = 4.5
		expect(result.concreteVolume).toBeCloseTo(4.5, 1);
		expect(result.rebarDetails.length).toBeGreaterThan(0);
	});
});

// ─── Regression: audit fixes 2026-07 ───

describe("calculateIsolatedFoundation — golden values (2×2×0.5, Φ16@5/m)", () => {
	const input = {
		quantity: 1,
		length: 2,
		width: 2,
		height: 0.5,
		bottomShort: { diameter: 16, barsPerMeter: 5 },
		bottomLong: { diameter: 16, barsPerMeter: 5 },
	};

	it("matches hand-calculated concrete, formwork and steel", () => {
		const r = calculateIsolatedFoundation(input);

		// خرسانة = 2×2×0.5 = 2 م³
		expect(r.concreteVolume).toBeCloseTo(2.0, 2);
		// شدات جوانب فقط = 2×(2+2)×0.5 = 4 م² (بدون شدة قاع)
		expect(r.formworkArea).toBeCloseTo(4.0, 2);

		// طول السيخ = 2 − 2×0.075 + 2×0.10 = 2.05 م، العدد = ceil(1.85×5)+1 = 11
		const short = r.rebarDetails.find((d) => d.direction === "فرش قصير");
		expect(short?.barLength).toBeCloseTo(2.05, 2);
		expect(short?.barCount).toBe(11);
		// صافي الاتجاه = 11×2.05×1.578 = 35.58 كجم؛ إجمالي = 3 أسياخ×12×1.578 = 56.81
		expect(short?.netWeight).toBeCloseTo(35.58, 1);
		expect(short?.grossWeight).toBeCloseTo(56.81, 1);
		expect(r.totals.netWeight).toBeCloseTo(71.16, 1);
		expect(r.totals.grossWeight).toBeCloseTo(113.62, 1);
	});

	it("reports zero plain concrete when lean concrete is disabled", () => {
		const r = calculateIsolatedFoundation(input);
		expect(r.plainConcreteVolume).toBe(0);
	});

	it("reports lean concrete volume when enabled", () => {
		const r = calculateIsolatedFoundation({ ...input, hasLeanConcrete: true, leanConcreteThickness: 0.1 });
		// (2.2×2.2×0.1) = 0.484 م³
		expect(r.plainConcreteVolume).toBeCloseTo(0.484, 3);
		expect(r.leanConcreteVolume).toBeCloseTo(0.484, 3);
	});
});

describe("calculateCombinedFoundation — bars longer than stock length (regression)", () => {
	it("never produces negative waste and splices long bars", () => {
		const r = calculateCombinedFoundation({
			quantity: 1,
			length: 13,
			width: 1.2,
			height: 0.6,
			columnCount: 4,
			columnSpacing: 4,
			bottomShort: { diameter: 16, barsPerMeter: 5 },
			bottomLong: { diameter: 16, barsPerMeter: 5 },
		});

		expect(r.totals.wastePercentage).toBeGreaterThanOrEqual(0);
		expect(r.totals.grossWeight).toBeGreaterThanOrEqual(r.totals.netWeight);
		for (const d of r.rebarDetails) {
			expect(d.wastePerStock).toBeGreaterThanOrEqual(0);
			expect(d.grossWeight).toBeGreaterThanOrEqual(d.netWeight);
		}

		// الفرش الطويل (13.05م) يجب أن يُقسم قطعتين بوصلة 40d
		const long = r.rebarDetails.find((d) => d.direction === "فرش طويل") as any;
		expect(long?.spliceInfo?.piecesPerBar).toBe(2);
		expect(long?.spliceInfo?.splicesPerBar).toBe(1);
	});
});

describe("calculateRaftFoundation — splices and edge beams", () => {
	it("splices bars longer than 12m with correct piece count", () => {
		const r = calculateRaftFoundation({
			length: 18,
			width: 10,
			thickness: 0.5,
			bottomX: { diameter: 16, barsPerMeter: 5 },
			bottomY: { diameter: 16, barsPerMeter: 5 },
		});

		// سفلي اتجاه Y يمتد على الطول 18م → 18.05م > 12م → قطعتان
		const spliceY = r.spliceDetails.find((s) => s.direction === "سفلي اتجاه Y");
		expect(spliceY?.piecesPerBar).toBe(2);
		expect(spliceY?.splicesPerBar).toBe(1);
		expect(r.totals.grossWeight).toBeGreaterThanOrEqual(r.totals.netWeight);
	});

	it("adds edge beam concrete (corner-deduplicated), steel and side formwork", () => {
		const r = calculateRaftFoundation({
			length: 10,
			width: 10,
			thickness: 0.5,
			hasEdgeBeams: true,
			edgeBeamWidth: 0.3,
			edgeBeamDepth: 0.4,
			bottomX: { diameter: 16, barsPerMeter: 5 },
			bottomY: { diameter: 16, barsPerMeter: 5 },
		});

		// حجم التسميك = (40 − 4×0.3)×0.3×0.4 = 4.656 م³
		expect(r.edgeBeamConcreteVolume).toBeCloseTo(4.656, 2);
		expect(r.totalConcreteVolume).toBeCloseTo(50 + 4.656, 2);
		// شدات = محيط×سماكة + وجهان للتسميك = 40×0.5 + 2×40×0.4 = 52 م²
		expect(r.formworkArea).toBeCloseTo(52, 1);
		// حديد التسميك التقديري = 4.656×120 = 558.72 كجم
		const edgeSteel = r.rebarDetails.find((d) => d.direction === "تسميك الحواف (تقديري)");
		expect(edgeSteel?.netWeight).toBeCloseTo(558.72, 0);
		// الصف التقديري (قطر 0) لا يدخل في تجميع أسياخ المصنع
		expect(r.totals.stocksNeeded.every((s) => s.diameter > 0)).toBe(true);
	});
});

describe("calculateStairs — formwork multiplier applied once (regression)", () => {
	it("does not double-apply STAIRS_FORMWORK_MULTIPLIER in cost", () => {
		const r = calculateStairs({
			width: 1.2,
			flightLength: 3,
			landingLength: 1.5,
			landingWidth: 1.2,
			thickness: 15,
			risersCount: 10,
			riserHeight: 17,
			treadDepth: 28,
			mainBarDiameter: 14,
			mainBarSpacing: 150,
			secondaryBarDiameter: 10,
			secondaryBarSpacing: 200,
		});

		// totalArea = 5.4 → formworkArea = 8.1 (×1.5 مرة واحدة) → التكلفة = 8.1×45
		expect(r.totalArea).toBeCloseTo(5.4, 2);
		expect(r.formworkArea).toBeCloseTo(8.1, 2);
		expect(r.formworkCost).toBeCloseTo(r.formworkArea * 45, 1);
	});
});

describe("calculateFoundation (legacy) — side formwork only (regression)", () => {
	it("excludes foundation bottom from formwork area", () => {
		const r = calculateFoundation({
			quantity: 2,
			length: 2,
			width: 2,
			depth: 0.5,
			mainBarDiameter: 16,
			mainBarSpacing: 200,
		});
		// 2×(2+2)×0.5×2 = 8 م² (كانت 16 مع شدة القاع)
		expect(r.formworkArea).toBeCloseTo(8, 2);
	});
});

describe("calculateOtherStructural — retaining wall excavation and GRC units", () => {
	it("uses embedment depth for excavation, not total wall height", () => {
		const r = calculateOtherStructural({
			id: "rw-1",
			elementType: "RETAINING_WALL",
			name: "جدار استنادي",
			wallType: "CANTILEVER",
			length: 10,
			height: 4,
			stemThickness: 25,
			baseWidth: 2.4,
			baseThickness: 30,
			quantity: 1,
		});
		// عمق التأسيس الافتراضي = 0.1 + 0.3 + 0.3 = 0.7م → (3.4)(11)(0.7) = 26.18 م³
		expect(r.excavationVolume).toBeCloseTo(26.18, 1);
	});

	it("respects explicit embedmentDepth", () => {
		const r = calculateOtherStructural({
			id: "rw-2",
			elementType: "RETAINING_WALL",
			name: "جدار استنادي",
			wallType: "CANTILEVER",
			length: 10,
			height: 4,
			stemThickness: 25,
			baseWidth: 2.4,
			baseThickness: 30,
			embedmentDepth: 1.2,
			quantity: 1,
		});
		expect(r.excavationVolume).toBeCloseTo(3.4 * 11 * 1.2, 1);
	});

	it("keeps GRC weight in kg in its own field, steel stays zero", () => {
		const r = calculateOtherStructural({
			id: "decor-1",
			elementType: "CONCRETE_DECOR",
			name: "كرانيش",
			items: [
				{ id: "c1", type: "CORNICE", material: "GRC", unit: "LINEAR_METER", length: 10, quantity: 2 },
			],
			quantity: 1,
		});
		// 10م × 2 × 25 كجم/م.ط = 500 كجم GRC — بلا قسمة على 1000 وبلا خلط مع الحديد
		expect(r.grcWeight).toBeCloseTo(500, 1);
		expect(r.totalGrcWeight).toBeCloseTo(500, 1);
		expect(r.steelWeight).toBe(0);
	});
});

describe("calculateRibbedSlab", () => {
	it("calculates block count and concrete for ribbed slab", () => {
		const result = calculateRibbedSlab({
			id: "test-2",
			name: "سقف هوردي",
			type: "ribbed",
			ribDirection: "x",
			floorName: "أول",
			quantity: 1,
			isComplete: false,
			dimensions: { length: 6, width: 5, grossArea: 30 },
			openings: [],
			system: {
				toppingThickness: 5,
				ribWidth: 15,
				ribDepth: 20,
				ribSpacing: 52,
				block: { width: 40, length: 20, height: 20, type: "concrete" },
			},
			reinforcement: {
				ribs: {
					bottom: { count: 2, diameter: 12 },
					top: { enabled: true, count: 2, diameter: 10 },
				},
				topping: {},
			},
		});

		expect(result.concreteVolume).toBeGreaterThan(0);
		expect(result.blocksCount).toBeGreaterThan(0);
	});
});
