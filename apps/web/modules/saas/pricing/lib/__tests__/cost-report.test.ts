import { describe, it, expect } from "vitest";
import { aggregateBOQ, type StructuralItem } from "../boq-aggregator";
import type { RecalcResult } from "../boq-recalculator";
import {
	computeItemMaterialCost,
	isIsolatedSteelItem,
	readMaterialPrices,
	type MaterialPrices,
} from "../cost-report";

const PRICES: MaterialPrices = readMaterialPrices({
	concretePrices: { C30: 205 },
	steelPriceD6: 2900,
	steelPriceD8: 3650,
	steelPriceMain: 3550,
	blockPrices: {},
	mortarSandPrice: 120,
	mortarCementPrice: 15,
	lintelConcretePrice: 0,
	lintelSteelPrice: 0,
	storagePercent: 4,
});

const column = (id: string, overrides: Partial<StructuralItem> = {}): StructuralItem => ({
	id,
	category: "columns",
	subCategory: "ground",
	name: `عمود ${id}`,
	quantity: 6,
	dimensions: {
		width: 30,
		depth: 60,
		height: 3,
		mainBarsCount: 8,
		mainBarDiameter: 16,
		stirrupDiameter: 8,
		stirrupSpacing: 150,
	},
	concreteVolume: 3.24,
	steelWeight: 420,
	totalCost: 0,
	...overrides,
});

function recalcMap(items: StructuralItem[]) {
	const boq = aggregateBOQ(items);
	const map = new Map<string, RecalcResult>();
	for (const section of boq.sections) {
		for (const group of section.subGroups) {
			for (const detail of group.items) map.set(detail.item.id, detail.recalc);
		}
	}
	return { boq, map };
}

describe("computeItemMaterialCost — steel basis", () => {
	// الحديد يجب أن يُسعَّر من طلبية المصنع المُحسَّنة نفسها التي يعرضها
	// تبويب «المواد»، وإلا اختلف تقرير التكلفة عن الملخص المعتمد
	it("total steel cost matches the optimized factory order", () => {
		const items = [
			column("c1"),
			column("c2", { dimensions: { width: 25, depth: 50, height: 3.2, mainBarsCount: 6, mainBarDiameter: 14, stirrupDiameter: 8, stirrupSpacing: 200 } }),
			column("c3", { dimensions: { width: 20, depth: 40, height: 2.8, mainBarsCount: 4, mainBarDiameter: 12, stirrupDiameter: 8, stirrupSpacing: 150 } }),
			column("c4", { dimensions: { width: 20, depth: 40, height: 2.8, mainBarsCount: 4, mainBarDiameter: 12, stirrupDiameter: 8, stirrupSpacing: 250 } }),
		];
		const { boq, map } = recalcMap(items);

		const perItem = items.reduce(
			(s, it) => s + computeItemMaterialCost(it as any, PRICES, map.get(it.id)).steelCost,
			0,
		);

		const fromFactory = boq.factoryOrder.reduce((s, e) => {
			const price =
				e.diameter <= 6
					? PRICES.steelPriceD6
					: e.diameter <= 8
						? PRICES.steelPriceD8
						: PRICES.steelPriceMain;
			return s + (e.weight / 1000) * price;
		}, 0);

		expect(perItem).toBeCloseTo(fromFactory, 2);
	});

	// بند تُقصّ كل قطعه من بواقي عمليات أخرى يخرج بصفر أسياخ جديدة —
	// كان يسقط في مسار "لا جدول تقطيع" فيُسعَّر مرة ثانية بوزنه المخزّن
	it("does not re-charge an item whose pieces all come from offcuts", () => {
		const items = [
			column("big", {
				quantity: 20,
				dimensions: { width: 40, depth: 80, height: 4, mainBarsCount: 12, mainBarDiameter: 16, stirrupDiameter: 8, stirrupSpacing: 100 },
			}),
			// كانات قصيرة كثيرة — تُقصّ من بواقي الكانات الأطول
			column("tiny", {
				quantity: 1,
				steelWeight: 5000,
				dimensions: { width: 15, depth: 15, height: 1, mainBarsCount: 4, mainBarDiameter: 12, stirrupDiameter: 8, stirrupSpacing: 250 },
			}),
		];
		const { boq, map } = recalcMap(items);

		const perItem = items.reduce(
			(s, it) => s + computeItemMaterialCost(it as any, PRICES, map.get(it.id)).steelCost,
			0,
		);
		const fromFactory = boq.factoryOrder.reduce((s, e) => {
			const price =
				e.diameter <= 6
					? PRICES.steelPriceD6
					: e.diameter <= 8
						? PRICES.steelPriceD8
						: PRICES.steelPriceMain;
			return s + (e.weight / 1000) * price;
		}, 0);

		// لو أُعيد تسعير البند بوزنه المخزّن (5 طن × 3550) لتضخّم الفرق
		expect(perItem).toBeCloseTo(fromFactory, 2);
	});

	// حديد الأساسات المعزول (إيبوكسي) — سعر واحد بغض النظر عن القطر،
	// ولا يُطبَّق إلا عند تفعيله في مواصفات الأعمال الإنشائية
	describe("isolated (epoxy) foundation steel", () => {
		const foundation: StructuralItem = {
			id: "f1",
			category: "foundations",
			subCategory: "isolated",
			name: "ق1",
			quantity: 8,
			dimensions: {
				length: 2,
				width: 2,
				height: 0.6,
				bottomShortDiameter: 16,
				bottomLongDiameter: 16,
				bottomShortBarsPerMeter: 5,
				bottomLongBarsPerMeter: 5,
			},
			concreteVolume: 19.2,
			steelWeight: 1200,
			totalCost: 0,
		};

		it("classifies foundations, ground beams and column necks", () => {
			expect(isIsolatedSteelItem({ category: "foundations", subCategory: "raft" })).toBe(true);
			expect(isIsolatedSteelItem({ category: "beams", subCategory: "groundBeam" })).toBe(true);
			expect(isIsolatedSteelItem({ category: "columns", subCategory: "ground_neck" })).toBe(true);
			expect(isIsolatedSteelItem({ category: "columns", subCategory: "ground" })).toBe(false);
			expect(isIsolatedSteelItem({ category: "beams", subCategory: "beam" })).toBe(false);
			expect(isIsolatedSteelItem({ category: "slabs", subCategory: "solid" })).toBe(false);
		});

		it("applies the isolated price only when the toggle is on", () => {
			const items = [foundation, column("c1")];
			const { map } = recalcMap(items);

			const off = computeItemMaterialCost(foundation as any, PRICES, map.get("f1"));
			const onPrices = { ...PRICES, hasIsolatedSteel: true, steelPriceIsolated: 5200 };
			const on = computeItemMaterialCost(foundation as any, onPrices, map.get("f1"));

			expect(on.steelTons).toBeCloseTo(off.steelTons, 6);
			expect(on.steelCost).toBeCloseTo(on.steelTons * 5200, 2);
			expect(on.steelCost).toBeGreaterThan(off.steelCost);

			// الأعمدة العادية لا تتأثر
			const columnOn = computeItemMaterialCost(items[1] as any, onPrices, map.get("c1"));
			const columnOff = computeItemMaterialCost(items[1] as any, PRICES, map.get("c1"));
			expect(columnOn.steelCost).toBeCloseTo(columnOff.steelCost, 2);
		});
	});

	// الحديد المحسوب بالنِسَب (قباب/مآذن) لا جدول قص له — يُسعَّر بوزنه المخزّن
	it("prices ratio-based steel from the stored weight", () => {
		const items = [
			column("c1"),
			{
				id: "dome",
				category: "otherStructural",
				subCategory: "otherStructural",
				name: "قبة",
				quantity: 1,
				dimensions: { elementType: "DOME" } as any,
				concreteVolume: 111.6,
				steelWeight: 7106.26,
				totalCost: 0,
			} as StructuralItem,
		];
		const { boq, map } = recalcMap(items);

		const dome = computeItemMaterialCost(items[1] as any, PRICES, map.get("dome"));
		expect(dome.steelTons).toBeCloseTo(7.10626, 4);
		expect(dome.steelCost).toBeCloseTo(7.10626 * PRICES.steelPriceMain, 2);
		expect(boq.unscheduledSteelWeight).toBeCloseTo(7106.26, 2);
	});
});
