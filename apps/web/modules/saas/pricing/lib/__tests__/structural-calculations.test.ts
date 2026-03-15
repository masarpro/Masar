import { describe, it, expect } from "vitest";
import {
	getRebarWeightPerMeter,
	calculateBarCount,
	calculateBarLength,
	calculateIsolatedFoundation,
	calculateColumnRebar,
	calculateBeamRebar,
	calculateStaircaseRebar,
	calculateSolidSlab,
	calculateRibbedSlab,
} from "../structural-calculations";

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
