import { describe, expect, it } from "vitest";
import {
	foundationBendCodeMinimum,
	resolveFoundationLeg,
	splitFoundationBarGroups,
} from "../structural-calculations";

/**
 * ثني أطراف شبكة القاعدة (الرجل)
 *
 * المرجع الهندسي: الرجل تصعد على وجه القاعدة الجانبي، فأقصى طول
 * هندسي = العمق − الغطاء السفلي − الغطاء العلوي. الحد الأدنى الكودي
 * (SBC 304 / ACI 318) = 12 مرة قطر السيخ، ولا يقل عملياً عن 30 سم.
 */
describe("foundationBendCodeMinimum", () => {
	it("لا يقل عن 30 سم للأقطار الصغيرة", () => {
		expect(foundationBendCodeMinimum(12)).toBeCloseTo(0.3, 6); // 12×12=144مم < 300
		expect(foundationBendCodeMinimum(16)).toBeCloseTo(0.3, 6); // 192مم < 300
		expect(foundationBendCodeMinimum(25)).toBeCloseTo(0.3, 6); // 300مم = 300
	});

	it("يساوي 12 مرة القطر للأقطار الكبيرة", () => {
		expect(foundationBendCodeMinimum(28)).toBeCloseTo(0.336, 6);
		expect(foundationBendCodeMinimum(32)).toBeCloseTo(0.384, 6);
	});
});

describe("resolveFoundationLeg", () => {
	it("يعيد صفراً بدون ثني", () => {
		expect(resolveFoundationLeg(undefined, 1.2, 0.075, 0.05)).toBe(0);
		expect(resolveFoundationLeg({ mode: "none" }, 1.2, 0.075, 0.05)).toBe(0);
	});

	it("يحسب الأقصى الهندسي تلقائياً — قاعدة المأذنة 120 سم", () => {
		// 1.20 − 0.075 − 0.05 = 1.075
		expect(resolveFoundationLeg({ mode: "all" }, 1.2, 0.075, 0.05)).toBeCloseTo(
			1.075,
			6,
		);
	});

	it("يحترم الطول اليدوي إن كان ضمن الحد الهندسي", () => {
		expect(
			resolveFoundationLeg({ mode: "all", legLength: 0.6 }, 1.2, 0.075, 0.05),
		).toBeCloseTo(0.6, 6);
	});

	it("يقصّ الطول اليدوي عند الأقصى الهندسي", () => {
		expect(
			resolveFoundationLeg({ mode: "all", legLength: 5 }, 1.2, 0.075, 0.05),
		).toBeCloseTo(1.075, 6);
	});

	it("لا يعيد قيمة سالبة عندما تفوق الأغطية العمق", () => {
		expect(resolveFoundationLeg({ mode: "all" }, 0.1, 0.075, 0.05)).toBe(0);
	});
});

describe("splitFoundationBarGroups", () => {
	const dim = 5.1;
	const coverSide = 0.075;
	const hook = 0.1;
	const clear = dim - 2 * coverSide; // 4.95

	it("بدون ثني — مجموعة واحدة بخطافين", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 0, "none", 30);
		expect(g).toHaveLength(1);
		expect(g[0].length).toBeCloseTo(clear + 2 * hook, 6); // 5.15
		expect(g[0].count).toBe(30);
		expect(g[0].bent).toBe(false);
	});

	it("رجل على كل سيخ — مجموعة واحدة بطول الرجلين (الرجل تحلّ محل الخطاف)", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 1.05, "all", 30);
		expect(g).toHaveLength(1);
		expect(g[0].length).toBeCloseTo(clear + 2 * 1.05, 6); // 7.05
		expect(g[0].count).toBe(30);
		expect(g[0].bent).toBe(true);
	});

	it("رجل بالتبادل — مجموعتان منفصلتان لا متوسط واحد", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 1.05, "alternate", 30);
		expect(g).toHaveLength(2);
		expect(g[0].bent).toBe(true);
		expect(g[0].count).toBe(15);
		expect(g[0].length).toBeCloseTo(7.05, 6);
		expect(g[1].bent).toBe(false);
		expect(g[1].count).toBe(15);
		expect(g[1].length).toBeCloseTo(5.15, 6);
		expect(g[0].count + g[1].count).toBe(30);
	});

	it("التبادل بعدد فردي — المثني يأخذ النصف الأعلى", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 1.05, "alternate", 31);
		expect(g[0].count).toBe(16);
		expect(g[1].count).toBe(15);
	});

	it("التبادل بسيخ واحد — مجموعة مثنية فقط بلا مجموعة فارغة", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 1.05, "alternate", 1);
		expect(g).toHaveLength(1);
		expect(g[0].bent).toBe(true);
		expect(g[0].count).toBe(1);
	});

	it("عدد صفري — مجموعة واحدة فارغة", () => {
		const g = splitFoundationBarGroups(dim, coverSide, hook, 1.05, "alternate", 0);
		expect(g).toHaveLength(1);
		expect(g[0].count).toBe(0);
	});
});

/**
 * حالة قواعد المآذن الفعلية (مسجد هيا العساف):
 * قاعدتان 5.10 × 5.73 × 1.20 م، 7Ø20/م، فرش وغطا في الاتجاهين (4 طبقات)،
 * غطاء جانبي 7.5 سم، رجل كاملة 1.075 م على كل سيخ.
 *
 * كل سيخ مقطوع يتجاوز 6 م، فلا يمكن قطع سيخين من سيخ 12 م القياسي —
 * أي أن عدد الأسياخ المشتراة = عدد القطع تماماً. هذا هو سبب مطابقة
 * الرقم الميداني (300 سيخ Ø20) بينما حساب الأطوال الصافية وحده يعطي أقل.
 */
describe("قواعد المآذن — تحقق من عدد الأسياخ", () => {
	const L = 5.73;
	const W = 5.1;
	const coverSide = 0.075;
	const hook = 0.1;
	const barsPerMeter = 7;
	const leg = resolveFoundationLeg({ mode: "all" }, 1.2, 0.075, 0.05);

	const barCount = (dimension: number) =>
		Math.ceil((dimension - 2 * coverSide) * barsPerMeter) + 1;

	it("الرجل الكاملة 1.075 م ضمن الكود لقطر 20", () => {
		expect(leg).toBeCloseTo(1.075, 6);
		expect(leg).toBeGreaterThan(foundationBendCodeMinimum(20));
	});

	it("عدد القطع = عدد الأسياخ المشتراة ويطابق ~300 سيخ للقاعدتين", () => {
		// اتجاه X: أسياخ بعرض القاعدة (W) موزعة على الطول (L)
		const xGroups = splitFoundationBarGroups(W, coverSide, hook, leg, "all", barCount(L));
		// اتجاه Y: أسياخ بطول القاعدة (L) موزعة على العرض (W)
		const yGroups = splitFoundationBarGroups(L, coverSide, hook, leg, "all", barCount(W));

		// طول القطعة بعد الثني يتجاوز 6 م → سيخ 12 م لكل قطعة
		for (const g of [...xGroups, ...yGroups]) {
			expect(g.length).toBeGreaterThan(6);
		}

		const perLayerX = xGroups[0].count; // فرش + غطا في X
		const perLayerY = yGroups[0].count;
		const piecesPerPad = 2 * perLayerX + 2 * perLayerY;
		const totalPieces = piecesPerPad * 2; // قاعدتان

		expect(totalPieces).toBeGreaterThanOrEqual(290);
		expect(totalPieces).toBeLessThanOrEqual(310);
	});
});
