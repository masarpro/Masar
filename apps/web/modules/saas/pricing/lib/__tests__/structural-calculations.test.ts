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

// ─── Other Structural: corrected formulas (audit 2026-07) ───

describe("calculateOtherStructural — dome spherical cap", () => {
	const baseDome = {
		id: "dome-1",
		elementType: "DOME" as const,
		name: "قبة",
		domeType: "HALF_SPHERE" as const,
		diameter: 8,
		riseHeight: 2,
		shellThicknessTop: 10,
		shellThicknessBottom: 15,
		hasRingBeam: false,
		ringBeamWidth: 30,
		ringBeamDepth: 60,
		hasDrum: false,
		hasSupportColumns: false,
		quantity: 1,
	};

	it("uses spherical-cap area for a shallow dome (not hemisphere)", () => {
		const r = calculateOtherStructural(baseDome);
		// a=4، h=2 → Rs=(16+4)/4=5 → المساحة=2π·5·2=62.83م² (وليس 100.53)
		// الحجم = 62.83 × 0.125 = 7.85 م³
		const shell = r.breakdown.find((b) => b.componentEn === "Dome Shell");
		expect(shell?.concreteVolume).toBeCloseTo(7.85, 2);
		// شدات وجهين = 2 × 62.83 = 125.66 م²
		expect(shell?.formworkArea).toBeCloseTo(125.66, 1);
		// حديد = 7.854 × 50 × 1.05 = 412.33 كجم
		expect(shell?.steelWeight).toBeCloseTo(412.33, 1);
	});

	it("falls back to hemisphere when riseHeight is missing", () => {
		const r = calculateOtherStructural({ ...baseDome, riseHeight: 0 });
		// h=a=4 → Rs=4 → المساحة=2π·16=100.53م² → الحجم=12.57م³
		const shell = r.breakdown.find((b) => b.componentEn === "Dome Shell");
		expect(shell?.concreteVolume).toBeCloseTo(12.57, 2);
	});

	it("GRC precast dome: weight only, no concrete/steel/formwork for the shell", () => {
		const r = calculateOtherStructural({ ...baseDome, domeType: "GRC_PRECAST" });
		expect(r.concreteVolumeRC).toBe(0);
		expect(r.steelWeight).toBe(0);
		expect(r.formworkArea).toBe(0);
		// 62.83م² × 50 كجم/م² = 3141.59 كجم
		expect(r.grcWeight).toBeCloseTo(3141.59, 1);
	});
});

describe("calculateOtherStructural — minaret footing and top cap", () => {
	const baseMinaret = {
		id: "min-1",
		elementType: "MINARET" as const,
		name: "مأذنة",
		shape: "CYLINDRICAL" as const,
		style: "MODERN" as const,
		totalHeight: 20,
		outerDiameter: 2.0,
		wallThickness: 25,
		hasBalcony: false,
		balconyCount: 0,
		balconyProjection: 80,
		topType: "CONE" as const,
		quantity: 1,
	};

	it("adds an RC footing sized outerDiameter + 2.0m at 0.8m thickness", () => {
		const r = calculateOtherStructural(baseMinaret);
		const footing = r.breakdown.find((b) => b.componentEn === "Foundation");
		// (2+2)² × 0.8 = 12.8 م³
		expect(footing?.concreteVolume).toBeCloseTo(12.8, 2);
		// حديد = 12.8 × 120 (MINARET_FOUNDATION) × 1.05 = 1612.8 كجم
		expect(footing?.steelWeight).toBeCloseTo(1612.8, 1);
		// حفر = (4+1)² × (0.8+0.3) = 27.5 م³
		expect(r.excavationVolume).toBeCloseTo(27.5, 1);
		// صبة نظافة تحت القاعدة = 16 × 0.1 = 1.6 م³
		expect(r.concreteVolumePlain).toBeCloseTo(1.6, 2);
	});

	it("adds a cone cap using lateral shell area with 10cm thickness", () => {
		const r = calculateOtherStructural(baseMinaret);
		const cap = r.breakdown.find((b) => b.componentEn === "Cone Cap");
		// r=1، h=1.5 → slant=√3.25=1.803 → مساحة جانبية=π·1·1.803=5.664م²
		// الحجم = 5.664 × 0.10 = 0.57 م³
		expect(cap?.concreteVolume).toBeCloseTo(0.57, 2);
	});

	it("GRC top: weight only, no concrete", () => {
		const r = calculateOtherStructural({ ...baseMinaret, topType: "GRC" });
		const cap = r.breakdown.find((b) => b.componentEn === "Top Cap (GRC)");
		expect(cap?.concreteVolume).toBe(0);
		// 5.664م² × 50 = 283.18 كجم
		expect(cap?.grcWeight).toBeCloseTo(283.18, 1);
	});

	it("small dome top: hemisphere shell 2πr² × 0.10m", () => {
		const r = calculateOtherStructural({ ...baseMinaret, topType: "DOME_SMALL" });
		const cap = r.breakdown.find((b) => b.componentEn === "Small Dome Cap");
		// 2π·1² × 0.10 = 0.63 م³
		expect(cap?.concreteVolume).toBeCloseTo(0.63, 2);
	});
});

describe("calculateOtherStructural — counterfort wall triangular ribs", () => {
	it("halves the counterfort prism volume (triangular elevation)", () => {
		const r = calculateOtherStructural({
			id: "rw-cf",
			elementType: "RETAINING_WALL",
			name: "جدار استنادي",
			wallType: "COUNTERFORT",
			length: 10,
			height: 4,
			stemThickness: 25,
			baseWidth: 2.4,
			baseThickness: 30,
			quantity: 1,
		});
		const cf = r.breakdown.find((b) => b.componentEn === "Counterforts");
		// العدد=floor(10/3)+1=4، الارتفاع=3.7، العرض=1.92، السماكة=0.25
		// الحجم = 4 × (3.7×1.92/2) × 0.25 = 3.55 م³ (كانت 7.10 كمنشور كامل)
		expect(cf?.concreteVolume).toBeCloseTo(3.55, 2);
		// الشدات وجها المثلث = 4 × 2 × (3.7×1.92/2) = 28.42 م²
		expect(cf?.formworkArea).toBeCloseTo(28.42, 1);
	});
});

describe("calculateOtherStructural — precast boundary wall", () => {
	it("computes panel concrete + steel with zero formwork", () => {
		const r = calculateOtherStructural({
			id: "bw-1",
			elementType: "BOUNDARY_WALL",
			name: "سور",
			wallType: "PRECAST",
			length: 10,
			height: 2.5,
			thickness: 20,
			hasRCColumns: false,
			columnSpacing: 3.5,
			hasFoundation: false,
			foundationWidth: 50,
			foundationDepth: 50,
			quantity: 1,
		});
		// 10 × 2.5 × 0.2 = 5 م³
		expect(r.concreteVolumeRC).toBeCloseTo(5.0, 2);
		// حديد بنسبة الجدار الخرساني = 5 × 95 × 1.05 = 498.75 كجم
		expect(r.steelWeight).toBeCloseTo(498.75, 1);
		// مسبق الصب — لا شدات
		expect(r.formworkArea).toBe(0);
	});
});

describe("calculateOtherStructural — open septic tank has no top slab", () => {
	const base = {
		id: "st-1",
		elementType: "SEPTIC_TANK" as const,
		name: "بيارة",
		tankType: "SEALED" as const,
		length: 4,
		width: 2,
		depth: 1.5,
		wallType: "RC" as const,
		wallThickness: 20,
		baseThickness: 25,
		slabThickness: 15,
		quantity: 1,
	};

	it("removes top slab concrete, formwork and roof waterproofing when OPEN", () => {
		const sealed = calculateOtherStructural(base);
		const open = calculateOtherStructural({ ...base, tankType: "OPEN" });

		expect(sealed.breakdown.some((b) => b.componentEn === "Top Slab")).toBe(true);
		expect(open.breakdown.some((b) => b.componentEn === "Top Slab")).toBe(false);

		// فرق الخرسانة = سقف 4.4×2.4×0.15 = 1.58 م³
		expect(sealed.concreteVolumeRC - open.concreteVolumeRC).toBeCloseTo(1.58, 2);
		// فرق العزل = مساحة السقف 4.4×2.4 = 10.56 م²
		expect(sealed.waterproofingArea - open.waterproofingArea).toBeCloseTo(10.56, 1);
	});

	it("block-wall OPEN tank also skips the top slab", () => {
		const open = calculateOtherStructural({ ...base, tankType: "OPEN", wallType: "BLOCK_20" });
		expect(open.breakdown.some((b) => b.componentEn === "Top Slab")).toBe(false);
		expect(open.blockCount).toBeGreaterThan(0);
	});
});

describe("calculateOtherStructural — decor materials RC/STONE get no GRC weight", () => {
	it("keeps the quantity line but computes zero weight for RC and STONE", () => {
		const r = calculateOtherStructural({
			id: "decor-2",
			elementType: "CONCRETE_DECOR",
			name: "ديكورات",
			items: [
				{ id: "d1", type: "PANEL", material: "RC", unit: "SQM", area: 10, quantity: 1 },
				{ id: "d2", type: "BELT", material: "STONE", unit: "LINEAR_METER", length: 10, quantity: 1 },
				{ id: "d3", type: "CORNICE", material: "GRC", unit: "LINEAR_METER", length: 10, quantity: 1 },
			],
			quantity: 1,
		});
		// GRC فقط: 10 × 25 = 250 كجم — بندا RC/STONE بلا وزن مُختلق
		expect(r.grcWeight).toBeCloseTo(250, 1);
		// بند RC يبقى ظاهراً بمساحته (10م²)
		const rcRow = r.breakdown.find((b) => b.componentEn === "PANEL");
		expect(rcRow?.formworkArea).toBeCloseTo(10, 1);
		expect(rcRow?.grcWeight ?? 0).toBe(0);
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
