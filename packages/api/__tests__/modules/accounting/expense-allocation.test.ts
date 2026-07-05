/**
 * Expense Allocation — Unit Tests
 *
 * يثبّت قاعدة توزيع مصروفات الشركة على مراكز التكلفة:
 * مجموع الموزَّع = الأصل الموزَّع بالضبط، وكسور التقريب لآخر مركز.
 */

import { describe, expect, it } from "vitest";
import { allocateByPercentages } from "../../../modules/accounting/lib/expense-allocation";

function sum(parts: Array<{ amount: number }>): number {
	return Math.round(parts.reduce((s, p) => s + p.amount, 0) * 100) / 100;
}

describe("allocateByPercentages", () => {
	it("100.00 موزعة على 3 مراكز بنسب ثلثية = 33.33 + 33.33 + 33.34 (الفرق للأخير)", () => {
		const parts = allocateByPercentages(100, [
			{ key: "p1", percentage: 100 / 3 },
			{ key: "p2", percentage: 100 / 3 },
			{ key: "p3", percentage: 100 / 3 },
		]);

		expect(parts.map((p) => p.amount)).toEqual([33.33, 33.33, 33.34]);
		expect(sum(parts)).toBe(100);
	});

	it("نسب صريحة 33.33/33.33/33.34 على 100.00", () => {
		const parts = allocateByPercentages(100, [
			{ key: "p1", percentage: 33.33 },
			{ key: "p2", percentage: 33.33 },
			{ key: "p3", percentage: 33.34 },
		]);

		expect(parts.map((p) => p.amount)).toEqual([33.33, 33.33, 33.34]);
		expect(sum(parts)).toBe(100);
	});

	it("توزيع جزئي (<100%) — يوزّع الجزء فقط والباقي يبقى غير موزَّع", () => {
		const parts = allocateByPercentages(1000, [
			{ key: "p1", percentage: 30 },
			{ key: "p2", percentage: 20 },
		]);

		expect(parts).toEqual([
			{ key: "p1", amount: 300 },
			{ key: "p2", amount: 200 },
		]);
		expect(sum(parts)).toBe(500); // 50% من 1000
	});

	it("مبالغ بكسور عشوائية — المجموع مطابق دائماً", () => {
		const amounts = [777.77, 999.99, 0.01, 123456.78, 33.33];
		for (const amount of amounts) {
			const parts = allocateByPercentages(amount, [
				{ key: "a", percentage: 100 / 3 },
				{ key: "b", percentage: 100 / 3 },
				{ key: "c", percentage: 100 / 3 },
			]);
			expect(sum(parts)).toBeCloseTo(
				Math.round(amount * 100) / 100,
				2,
			);
		}
	});

	it("مركز واحد بنسبة 100% يستلم المبلغ كاملاً", () => {
		const parts = allocateByPercentages(1234.56, [
			{ key: "only", percentage: 100 },
		]);
		expect(parts).toEqual([{ key: "only", amount: 1234.56 }]);
	});

	it("مبلغ صفر أو بلا مراكز → أصفار/فارغة", () => {
		expect(
			allocateByPercentages(0, [{ key: "a", percentage: 50 }]),
		).toEqual([{ key: "a", amount: 0 }]);
		expect(allocateByPercentages(100, [])).toEqual([]);
	});
});
