/**
 * Revenue By Period — Pinning Tests
 *
 * يثبّت مخرجات getRevenueByPeriod (عبر الدالة النقية groupPaymentsByMonth)
 * قبل وبعد تنظيف الدالة (حذف استعلام فواتير ميت كان يُجلب ولا يُستخدم).
 * الإيراد = دفعات الفواتير مجمّعة بشهر الدفع (أساس نقدي) — دون تغيير.
 *
 * اختبارات نقية — لا تتطلب قاعدة بيانات.
 */

import { describe, expect, it } from "vitest";
import { Prisma } from "../prisma/generated/client";
import { groupPaymentsByMonth } from "../prisma/queries/finance-reports";

const D = (v: number | string) => new Prisma.Decimal(v);

describe("groupPaymentsByMonth (pins getRevenueByPeriod output)", () => {
	it("يجمع الدفعات بشهر الدفع بمفتاح YYYY-MM", () => {
		const result = groupPaymentsByMonth([
			{ amount: D(1000), paymentDate: new Date(2026, 0, 10) }, // يناير
			{ amount: D(500), paymentDate: new Date(2026, 0, 25) }, // يناير
			{ amount: D(2000), paymentDate: new Date(2026, 2, 5) }, // مارس
		]);

		expect(result).toEqual([
			{ month: "2026-01", revenue: 1500 },
			{ month: "2026-03", revenue: 2000 },
		]);
	});

	it("يرتب الأشهر تصاعدياً عبر السنوات (فرز نصي على YYYY-MM)", () => {
		const result = groupPaymentsByMonth([
			{ amount: D(300), paymentDate: new Date(2026, 1, 1) },
			{ amount: D(100), paymentDate: new Date(2025, 11, 1) },
			{ amount: D(200), paymentDate: new Date(2026, 0, 1) },
		]);

		expect(result.map((r) => r.month)).toEqual([
			"2025-12",
			"2026-01",
			"2026-02",
		]);
	});

	it("يحول Prisma.Decimal إلى number ويجمع الكسور", () => {
		const result = groupPaymentsByMonth([
			{ amount: D("1234.56"), paymentDate: new Date(2026, 5, 1) },
			{ amount: D("0.44"), paymentDate: new Date(2026, 5, 2) },
		]);

		expect(result).toEqual([{ month: "2026-06", revenue: 1235 }]);
	});

	it("قائمة فارغة → مصفوفة فارغة", () => {
		expect(groupPaymentsByMonth([])).toEqual([]);
	});

	it("الشهر ذو الخانة الواحدة يُبطَّن بصفر", () => {
		const result = groupPaymentsByMonth([
			{ amount: D(10), paymentDate: new Date(2026, 8, 15) }, // سبتمبر
		]);
		expect(result[0].month).toBe("2026-09");
	});
});
