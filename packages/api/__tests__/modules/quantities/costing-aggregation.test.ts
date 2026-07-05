/**
 * Costing Aggregation — Unit Tests
 *
 * يثبّت إصلاح تضاعف تكلفة المواد في ملخص تسعير التكلفة:
 * - صفوف CostingItem مكررة (توليد متزامن تاريخي) كانت تُضاعف المواد
 *   بينما المصنعيات (lump sum على صف واحد) تبقى صحيحة.
 * - dedupeCostingItems يزيل التكرار مبقياً الأحدث تعديلاً.
 * - summarizeCostingItems يجمع الأقسام والإجماليات والمصاريف الإدارية.
 *
 * اختبارات نقية — لا حاجة لقاعدة بيانات.
 */

import { describe, expect, it } from "vitest";
import {
	dedupeCostingItems,
	summarizeCostingItems,
} from "../../../modules/quantities/lib/costing-aggregation";

type TestItem = {
	id: string;
	section: string;
	sourceItemId: string | null;
	sourceItemType: string | null;
	materialTotal: number | null;
	laborTotal: number | null;
	storageTotal: number | null;
	otherCosts: number | null;
	totalCost: number | null;
	updatedAt: Date;
};

function makeItem(overrides: Partial<TestItem> = {}): TestItem {
	return {
		id: "ci-1",
		section: "STRUCTURAL",
		sourceItemId: "src-1",
		sourceItemType: "StructuralItem",
		materialTotal: 1000,
		laborTotal: 0,
		storageTotal: 0,
		otherCosts: 0,
		totalCost: 1000,
		updatedAt: new Date("2026-06-01"),
		...overrides,
	};
}

describe("summarizeCostingItems", () => {
	it("بند واحد — يجمع قسماً واحداً بإجماليات صحيحة", () => {
		const summary = summarizeCostingItems(
			[makeItem({ materialTotal: 500, laborTotal: 200, totalCost: 700 })],
			5,
		);

		expect(summary.sections).toHaveLength(1);
		expect(summary.sections[0]).toMatchObject({
			section: "STRUCTURAL",
			materialTotal: 500,
			laborTotal: 200,
			total: 700,
			itemCount: 1,
		});
		expect(summary.grandTotal.material).toBe(500);
		expect(summary.grandTotal.labor).toBe(200);
		expect(summary.grandTotal.total).toBe(700);
		expect(summary.overheadAmount).toBeCloseTo(35, 2); // 5% من 700
		expect(summary.costWithOverhead).toBeCloseTo(735, 2);
	});

	it("بنود متعددة عبر أقسام — يجمع كل قسم على حدة والإجمالي معاً", () => {
		const summary = summarizeCostingItems(
			[
				makeItem({ id: "a", sourceItemId: "s1", materialTotal: 1000, laborTotal: 300, totalCost: 1300 }),
				makeItem({ id: "b", sourceItemId: "s2", materialTotal: 2000, laborTotal: 0, totalCost: 2000 }),
				makeItem({
					id: "c",
					sourceItemId: "f1",
					sourceItemType: "FinishingItem",
					section: "FINISHING",
					materialTotal: 500,
					laborTotal: 100,
					totalCost: 600,
				}),
			],
			10,
		);

		const structural = summary.sections.find((s) => s.section === "STRUCTURAL");
		const finishing = summary.sections.find((s) => s.section === "FINISHING");
		expect(structural?.materialTotal).toBe(3000);
		expect(structural?.laborTotal).toBe(300);
		expect(structural?.itemCount).toBe(2);
		expect(finishing?.materialTotal).toBe(500);
		expect(summary.grandTotal.material).toBe(3500);
		expect(summary.grandTotal.total).toBe(3900);
		expect(summary.overheadAmount).toBeCloseTo(390, 2);
	});

	it("بند بكميات/قيم صفرية — لا يؤثر على الإجماليات ويُحتسب في العدد", () => {
		const summary = summarizeCostingItems(
			[
				makeItem({ id: "a", sourceItemId: "s1", materialTotal: 800, totalCost: 800 }),
				makeItem({
					id: "zero",
					sourceItemId: "s2",
					materialTotal: 0,
					laborTotal: 0,
					storageTotal: 0,
					otherCosts: 0,
					totalCost: 0,
				}),
				makeItem({
					id: "nulls",
					sourceItemId: "s3",
					materialTotal: null,
					laborTotal: null,
					storageTotal: null,
					otherCosts: null,
					totalCost: null,
				}),
			],
			5,
		);

		expect(summary.sections[0].materialTotal).toBe(800);
		expect(summary.sections[0].total).toBe(800);
		expect(summary.sections[0].itemCount).toBe(3);
		expect(summary.grandTotal.total).toBe(800);
	});
});

describe("dedupeCostingItems — إصلاح تضاعف المواد", () => {
	it("يزيل الصف المكرر لنفس البند المصدري (سيناريو 18,134.49 → 36,268.98)", () => {
		// محاكاة التوليد المزدوج: نفس البنود مرتين، المصنعيات lump sum على الصف الأول فقط
		const original = [
			makeItem({ id: "a1", sourceItemId: "s1", materialTotal: 10000, laborTotal: 7000, totalCost: 17000 }),
			makeItem({ id: "a2", sourceItemId: "s2", materialTotal: 8134.49, laborTotal: 0, totalCost: 8134.49 }),
		];
		const duplicates = [
			makeItem({ id: "b1", sourceItemId: "s1", materialTotal: 10000, laborTotal: 0, totalCost: 10000, updatedAt: new Date("2026-05-01") }),
			makeItem({ id: "b2", sourceItemId: "s2", materialTotal: 8134.49, laborTotal: 0, totalCost: 8134.49, updatedAt: new Date("2026-05-01") }),
		];

		// بدون إزالة التكرار: المواد تتضاعف والمصنعيات تبقى صحيحة (الخلل الأصلي)
		const buggy = summarizeCostingItems([...original, ...duplicates], 0);
		expect(buggy.grandTotal.material).toBeCloseTo(36268.98, 2);
		expect(buggy.grandTotal.labor).toBeCloseTo(7000, 2);

		// مع إزالة التكرار: المواد صحيحة
		const fixed = summarizeCostingItems(dedupeCostingItems([...original, ...duplicates]), 0);
		expect(fixed.grandTotal.material).toBeCloseTo(18134.49, 2);
		expect(fixed.grandTotal.labor).toBeCloseTo(7000, 2);
		expect(fixed.grandTotal.total).toBeCloseTo(18134.49 + 7000, 2);
		expect(fixed.sections[0].itemCount).toBe(2);
	});

	it("يُبقي الصف الأحدث تعديلاً (تعديلات المستخدم لا تضيع)", () => {
		const stale = makeItem({ id: "old", materialTotal: 1000, updatedAt: new Date("2026-01-01") });
		const edited = makeItem({ id: "new", materialTotal: 1500, updatedAt: new Date("2026-06-15") });

		const result = dedupeCostingItems([stale, edited]);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("new");
	});

	it("لا يمس البنود اليدوية (sourceItemId = null) حتى لو تشابهت", () => {
		const manual1 = makeItem({ id: "m1", sourceItemId: null, sourceItemType: null, section: "MANUAL" });
		const manual2 = makeItem({ id: "m2", sourceItemId: null, sourceItemType: null, section: "MANUAL" });

		expect(dedupeCostingItems([manual1, manual2])).toHaveLength(2);
	});

	it("لا يخلط بين أنواع مصادر مختلفة بنفس المعرف", () => {
		const structural = makeItem({ id: "a", sourceItemId: "x", sourceItemType: "StructuralItem" });
		const finishing = makeItem({ id: "b", sourceItemId: "x", sourceItemType: "FinishingItem", section: "FINISHING" });

		expect(dedupeCostingItems([structural, finishing])).toHaveLength(2);
	});

	it("قائمة بلا تكرار تمر كما هي", () => {
		const items = [
			makeItem({ id: "a", sourceItemId: "s1" }),
			makeItem({ id: "b", sourceItemId: "s2" }),
		];
		expect(dedupeCostingItems(items)).toHaveLength(2);
	});
});
