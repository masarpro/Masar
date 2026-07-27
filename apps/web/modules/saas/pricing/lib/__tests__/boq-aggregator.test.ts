import { describe, it, expect } from "vitest";
import {
	aggregateBOQ,
	getItemFloorGroup,
	buildFloorFilterOptions,
	filterItemsByFloor,
	resolveConstructionStage,
	type StructuralItem,
} from "../boq-aggregator";
import { reconcileCuttingWithFactoryOrder } from "../boq-recalculator";

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

	// ─── تطابق تبويبي "طلبية المصنع" و"تفاصيل التفصيل" ───
	// كانا يعرضان رقمين مختلفين لنفس الحديد: الطلبية بعد إعادة استخدام
	// البواقي، والتقطيع قبلها.
	it("cutting details totals match the factory order exactly", () => {
		const items = [
			makeItem({ id: "c1", quantity: 12 }),
			makeItem({
				id: "b1",
				category: "beams",
				subCategory: "beam",
				name: "كمرة K1",
				quantity: 6,
				dimensions: { width: 30, height: 60, length: 5, topBarsCount: 3, topBarDiameter: 16, bottomBarsCount: 4, bottomBarDiameter: 18, stirrupDiameter: 8, stirrupSpacing: 150 },
			}),
			makeItem({
				id: "f1",
				category: "foundations",
				subCategory: "isolated",
				name: "ق1",
				quantity: 8,
				dimensions: { length: 2, width: 2, height: 0.6, bottomShortDiameter: 16, bottomLongDiameter: 16, bottomShortBarsPerMeter: 5, bottomLongBarsPerMeter: 5 },
			}),
		];
		const result = aggregateBOQ(items);

		expect(result.allCuttingDetails.length).toBeGreaterThan(0);

		const factoryBars = result.factoryOrder.reduce((s, e) => s + e.count, 0);
		const cuttingBars = result.allCuttingDetails.reduce((s, d) => s + d.stocksNeeded, 0);
		expect(cuttingBars).toBe(factoryBars);

		const factoryWeight = result.factoryOrder.reduce((s, e) => s + e.weight, 0);
		const cuttingWeight = result.allCuttingDetails.reduce((s, d) => s + d.grossWeight, 0);
		expect(cuttingWeight).toBeCloseTo(factoryWeight, 0);

		// وكذلك لكل قطر على حدة
		for (const entry of result.factoryOrder) {
			const perDiameter = result.allCuttingDetails
				.filter((d) => d.diameter === entry.diameter)
				.reduce((s, d) => s + d.stocksNeeded, 0);
			expect(perDiameter).toBe(entry.count);
		}
	});

	it("reports ratio-based steel that has no cutting schedule", () => {
		const items = [
			makeItem({ id: "c1" }),
			makeItem({
				id: "dome-1",
				category: "otherStructural",
				subCategory: "otherStructural",
				name: "قبة",
				quantity: 1,
				concreteVolume: 111.6,
				steelWeight: 7106.26,
				dimensions: { elementType: "DOME" } as any,
			}),
		];
		const result = aggregateBOQ(items);

		// حديد القبة محسوب بالنِسَب — لا صفوف قص له، فيُبلَّغ عنه منفصلاً
		expect(result.unscheduledSteelWeight).toBeCloseTo(7106.26, 2);
		// وحديد الأعمدة له صفوف قص فلا يُحتسب ضمنه
		expect(result.allCuttingDetails.length).toBeGreaterThan(0);
	});

	it("reports zero unscheduled steel when every item has a cutting schedule", () => {
		const result = aggregateBOQ([makeItem()]);
		expect(result.unscheduledSteelWeight).toBe(0);
	});
});

// ─── مراحل التنفيذ ونطاق إعادة استخدام البواقي ───

describe("resolveConstructionStage", () => {
	const floors = [
		{ id: "ground", label: "الأرضي", sortOrder: 0 },
		{ id: "first", label: "الأول", sortOrder: 1 },
		{ id: "roof", label: "السطح", sortOrder: 2 },
	];

	const at = (item: Partial<StructuralItem>) =>
		resolveConstructionStage(makeItem(item), floors);

	it("pours foundations, blinding and column necks together", () => {
		expect(at({ category: "plainConcrete", subCategory: "blinding" })).toBe(1);
		expect(at({ category: "foundations", subCategory: "raft" })).toBe(1);
		expect(at({ category: "columns", subCategory: "ground_neck" })).toBe(1);
	});

	it("pours ground beams with the ground floor columns", () => {
		expect(at({ category: "beams", subCategory: "groundBeam" })).toBe(2);
		expect(at({ category: "columns", subCategory: "ground" })).toBe(2);
	});

	it("pours each slab with the columns of the floor above it", () => {
		const slabGround = at({
			category: "slabs",
			subCategory: "solid",
			dimensions: { floor: "الأرضي" } as any,
		});
		expect(slabGround).toBe(3);
		expect(at({ category: "columns", subCategory: "first" })).toBe(3);

		const slabFirst = at({
			category: "slabs",
			subCategory: "solid",
			dimensions: { floor: "الأول" } as any,
		});
		expect(slabFirst).toBe(4);
		expect(at({ category: "columns", subCategory: "roof" })).toBe(4);
	});

	it("keeps the chain going for any number of floors", () => {
		const many = Array.from({ length: 12 }, (_, i) => ({
			id: i === 0 ? "ground" : `upper_${i - 1}`,
			label: `دور ${i}`,
			sortOrder: i,
		}));
		const top = resolveConstructionStage(
			makeItem({ category: "columns", subCategory: "upper_10" }),
			many,
		);
		expect(top).toBe(2 + 11);
	});
});

describe("staged remnant reuse", () => {
	const floors = [
		{ id: "ground", label: "الأرضي", sortOrder: 0 },
		{ id: "first", label: "الأول", sortOrder: 1 },
	];

	// بواقي مرحلة لاحقة لا تعود لتخدم مرحلة صُبّت قبلها، فعدد الأسياخ
	// المطلوب مع المراحل لا يقل أبداً عن حساب البركة الواحدة
	it("never orders fewer bars than unrestricted reuse", () => {
		const items: StructuralItem[] = [
			makeItem({
				id: "f1",
				category: "foundations",
				subCategory: "raft",
				name: "لبشة",
				quantity: 1,
				dimensions: {
					length: 12,
					width: 10,
					thickness: 0.8,
					bottomXDiameter: 16,
					bottomYDiameter: 16,
					bottomXBarsPerMeter: 5,
					bottomYBarsPerMeter: 5,
				},
			}),
			makeItem({
				id: "c-ground",
				category: "columns",
				subCategory: "ground",
				quantity: 20,
			}),
			makeItem({
				id: "s-ground",
				category: "slabs",
				subCategory: "solid",
				name: "سقف الأرضي",
				quantity: 1,
				dimensions: {
					floor: "الأرضي",
					length: 11,
					width: 9,
					cover: 0.025,
					bottomMainDiameter: 16,
					bottomMainBarsPerMeter: 5,
					bottomSecondaryDiameter: 12,
					bottomSecondaryBarsPerMeter: 5,
				} as any,
			}),
			makeItem({
				id: "c-first",
				category: "columns",
				subCategory: "first",
				quantity: 20,
			}),
		];

		const staged = aggregateBOQ(items, floors);
		const stagedBars = staged.factoryOrder.reduce((s, e) => s + e.count, 0);

		// نفس البنود لكن بمرحلة واحدة للجميع (إعادة استخدام بلا قيد)
		const pooled = aggregateBOQ(items.map((i) => ({ ...i })), floors);
		for (const row of pooled.allCuttingDetails) row.stage = 0;
		const pooledStocks = reconcileCuttingWithFactoryOrder(pooled.allCuttingDetails);
		const pooledBars = pooledStocks.reduce((s, e) => s + e.count, 0);

		expect(stagedBars).toBeGreaterThanOrEqual(pooledBars);
	});

	// التطابق بين تبويبي الطلبية والتقطيع يبقى قائماً بعد التقييد
	it("keeps cutting details in sync with the factory order", () => {
		const items: StructuralItem[] = [
			makeItem({ id: "c1", subCategory: "ground", quantity: 10 }),
			makeItem({ id: "c2", subCategory: "first", quantity: 10 }),
			makeItem({
				id: "f1",
				category: "foundations",
				subCategory: "isolated",
				quantity: 6,
				dimensions: {
					length: 2,
					width: 2,
					height: 0.6,
					bottomShortDiameter: 16,
					bottomLongDiameter: 16,
					bottomShortBarsPerMeter: 5,
					bottomLongBarsPerMeter: 5,
				},
			}),
		];
		const result = aggregateBOQ(items, floors);

		for (const entry of result.factoryOrder) {
			const fromRows = result.allCuttingDetails
				.filter((d) => d.diameter === entry.diameter)
				.reduce((s, d) => s + d.stocksNeeded, 0);
			expect(fromRows).toBe(entry.count);
		}
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
