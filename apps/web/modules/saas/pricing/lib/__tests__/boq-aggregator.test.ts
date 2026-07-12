import { describe, it, expect } from "vitest";
import {
	aggregateBOQ,
	getItemFloorGroup,
	buildFloorFilterOptions,
	filterItemsByFloor,
	type StructuralItem,
} from "../boq-aggregator";

const makeItem = (overrides: Partial<StructuralItem> = {}): StructuralItem => ({
	id: "item-1",
	category: "columns",
	subCategory: "ground",
	name: "عمود C1",
	quantity: 4,
	dimensions: { width: 30, depth: 30, height: 3, mainBarsCount: 8, mainBarDiameter: 16, stirrupDiameter: 8, stirrupSpacing: 150 },
	concreteVolume: 1.08,
	steelWeight: 45,
	totalCost: 2000,
	...overrides,
});

describe("aggregateBOQ", () => {
	it("returns empty sections for empty items", () => {
		const result = aggregateBOQ([]);
		expect(result.sections).toHaveLength(0);
		expect(result.grandTotals.concrete).toBe(0);
	});

	it("aggregates single column item", () => {
		const items = [makeItem()];
		const result = aggregateBOQ(items);

		expect(result.sections.length).toBeGreaterThan(0);
		const colSection = result.sections.find(s => s.category === "columns");
		expect(colSection).toBeDefined();
		expect(result.grandTotals.concrete).toBeGreaterThan(0);
	});

	it("aggregates otherStructural saved results: formwork, blocks, plain concrete, extras", () => {
		const items = [
			makeItem({
				id: "os-1",
				category: "otherStructural",
				subCategory: "otherStructural",
				name: "بيارة",
				quantity: 1,
				concreteVolume: 5.2, // RC فقط
				steelWeight: 480,
				dimensions: {
					elementType: "SEPTIC_TANK",
					__result: {
						elementType: "SEPTIC_TANK",
						name: "بيارة",
						quantity: 1,
						concreteVolumeRC: 5.2,
						concreteVolumePlain: 1.06,
						steelWeight: 480,
						formworkArea: 55.4,
						waterproofingArea: 60.2,
						excavationVolume: 40.1,
						blockCount: 120,
						mortarVolume: 0.12,
						grcWeight: 0,
						totalConcreteRC: 5.2,
						totalConcretePlain: 1.06,
						totalSteelWeight: 480,
						totalFormwork: 55.4,
						totalGrcWeight: 0,
						breakdown: [],
					},
				} as any,
			}),
		];
		const result = aggregateBOQ(items);
		const section = result.sections.find((s) => s.category === "otherStructural");
		expect(section).toBeDefined();
		// الشدات من __result.totalFormwork (كانت 0 دائماً قبل الإصلاح)
		expect(result.grandTotals.formwork).toBeCloseTo(55.4, 1);
		// البلوك يدخل في مجاميع القسم
		expect(section?.totalBlocks).toBe(120);
		// الخرسانة العادية تدخل الإجمالي العام (RC 5.2 + نظافة 1.06)
		expect(result.grandTotals.concrete).toBeCloseTo(6.26, 2);
		// المواد الإضافية تظهر في القسم
		expect(section?.extras?.plainConcrete).toBeCloseTo(1.06, 2);
		expect(section?.extras?.waterproofingArea).toBeCloseTo(60.2, 1);
		expect(section?.extras?.excavationVolume).toBeCloseTo(40.1, 1);
		expect(section?.extras?.mortarVolume).toBeCloseTo(0.12, 2);
	});

	it("keeps legacy otherStructural items (no __result) at previous behavior", () => {
		const items = [
			makeItem({
				id: "os-legacy",
				category: "otherStructural",
				subCategory: "otherStructural",
				name: "خزان قديم",
				quantity: 1,
				concreteVolume: 6.0, // RC+عادية مدموجة (سلوك قديم)
				steelWeight: 300,
				dimensions: { elementType: "WATER_TANK_GROUND" } as any,
			}),
		];
		const result = aggregateBOQ(items);
		const section = result.sections.find((s) => s.category === "otherStructural");
		expect(section?.totalConcrete).toBeCloseTo(6.0, 2);
		expect(section?.extras).toBeUndefined();
		expect(result.grandTotals.concrete).toBeCloseTo(6.0, 2);
	});

	it("separates ground beams from regular beams", () => {
		const items = [
			makeItem({
				id: "beam-1",
				category: "beams",
				subCategory: "beam",
				name: "كمرة K1",
				dimensions: { width: 30, height: 60, length: 5, topBarsCount: 3, topBarDiameter: 16, bottomBarsCount: 4, bottomBarDiameter: 18, stirrupDiameter: 8, stirrupSpacing: 150 },
			}),
			makeItem({
				id: "gbeam-1",
				category: "beams",
				subCategory: "groundBeam",
				name: "ميدة M1",
				dimensions: { width: 30, height: 60, length: 5, topBarsCount: 3, topBarDiameter: 16, bottomBarsCount: 4, bottomBarDiameter: 18, stirrupDiameter: 8, stirrupSpacing: 150 },
			}),
		];
		const result = aggregateBOQ(items);

		const categories = result.sections.map(s => s.category);
		expect(categories).toContain("beams");
		expect(categories).toContain("groundBeams");
	});
});

describe("getItemFloorGroup", () => {
	it("returns subCategory as floor for columns", () => {
		const item = makeItem({ category: "columns", subCategory: "ground" });
		expect(getItemFloorGroup(item)).toBe("ground");
	});

	it("returns 'foundations' for foundation items", () => {
		const item = makeItem({ category: "foundations" });
		expect(getItemFloorGroup(item)).toBe("foundations");
	});

	it("returns 'foundations' for plainConcrete", () => {
		const item = makeItem({ category: "plainConcrete" });
		expect(getItemFloorGroup(item)).toBe("foundations");
	});
});

describe("buildFloorFilterOptions", () => {
	it("always includes 'all' option", () => {
		const options = buildFloorFilterOptions([]);
		expect(options.length).toBe(1);
		expect(options[0].value).toBe("all");
	});

	it("includes foundations if foundation items exist", () => {
		const items = [makeItem({ category: "foundations" })];
		const options = buildFloorFilterOptions(items);
		expect(options.some(o => o.value === "foundations")).toBe(true);
	});
});

describe("filterItemsByFloor", () => {
	it("returns all items for 'all' filter", () => {
		const items = [makeItem(), makeItem({ id: "2" })];
		expect(filterItemsByFloor(items, "all")).toEqual(items);
	});

	it("filters foundation items", () => {
		const items = [
			makeItem({ category: "foundations" }),
			makeItem({ id: "2", category: "columns", subCategory: "first" }),
		];
		const filtered = filterItemsByFloor(items, "foundations");
		expect(filtered).toHaveLength(1);
		expect(filtered[0].category).toBe("foundations");
	});
});
