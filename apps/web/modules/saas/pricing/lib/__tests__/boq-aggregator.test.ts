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
