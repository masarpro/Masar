import { describe, expect, it } from "vitest";
import { computeBeamCalc, getBeamNetHeight } from "../helpers";
import type { SlabBeamDef } from "../types";
import { getDefaultBeam } from "../types";

const makeBeam = (overrides: Partial<SlabBeamDef> = {}): SlabBeamDef => ({
	...getDefaultBeam(0),
	...overrides,
});

describe("getBeamNetHeight", () => {
	it("يُعيد الارتفاع الكامل للكمرة الساقطة", () => {
		const beam = makeBeam({ height: 60, isHidden: false });
		expect(getBeamNetHeight(beam, 30)).toBe(60);
	});

	it("يُصفّر ارتفاع الكمرة المخفية المدفونة كلياً داخل البلاطة", () => {
		const beam = makeBeam({ height: 30, isHidden: true });
		expect(getBeamNetHeight(beam, 30)).toBe(0);
	});

	it("يُعيد الجزء الساقط فقط للكمرة المخفية الأعمق من البلاطة", () => {
		const beam = makeBeam({ height: 60, isHidden: true });
		expect(getBeamNetHeight(beam, 25)).toBe(35);
	});

	it("لا يُعيد قيمة سالبة عندما تكون البلاطة أسمك من الكمرة", () => {
		const beam = makeBeam({ height: 25, isHidden: true });
		expect(getBeamNetHeight(beam, 40)).toBe(0);
	});

	it("يتعامل مع الكمرات القديمة (بدون خاصية isHidden) كساقطة", () => {
		const { isHidden, ...legacy } = makeBeam({ height: 60 });
		expect(getBeamNetHeight(legacy as SlabBeamDef, 30)).toBe(60);
	});
});

describe("computeBeamCalc — خرسانة الكمرات المخفية", () => {
	it("يحسب الخرسانة كاملة للكمرة الساقطة", () => {
		const beam = makeBeam({
			quantity: 2,
			width: 20,
			height: 60,
			length: 10,
			isHidden: false,
		});
		const calc = computeBeamCalc(beam, "C30", 30);
		// 0.20 × 0.60 × 10 × 2 = 2.40 م³
		expect(calc.concreteVolume).toBeCloseTo(2.4, 4);
		expect(calc.hiddenConcreteDeduction).toBeCloseTo(0, 6);
	});

	it("يخصم خرسانة الكمرة المخفية بالكامل عندما يساوي عمقها سماكة البلاطة", () => {
		const beam = makeBeam({
			quantity: 3,
			width: 60,
			height: 30,
			length: 10.5,
			isHidden: true,
		});
		const calc = computeBeamCalc(beam, "C30", 30);
		// كل الحجم مدفون داخل البلاطة → لا خرسانة إضافية
		expect(calc.concreteVolume).toBeCloseTo(0, 6);
		// 0.60 × 0.30 × 10.5 × 3 = 5.67 م³ خُصمت
		expect(calc.grossConcreteVolume).toBeCloseTo(5.67, 4);
		expect(calc.hiddenConcreteDeduction).toBeCloseTo(5.67, 4);
	});

	it("يحتسب الجزء الساقط فقط للكمرة المخفية جزئياً", () => {
		const beam = makeBeam({
			quantity: 1,
			width: 40,
			height: 60,
			length: 10,
			isHidden: true,
		});
		const calc = computeBeamCalc(beam, "C30", 25);
		// الجزء الساقط = 60 − 25 = 35 سم → 0.40 × 0.35 × 10 = 1.40 م³
		expect(calc.netHeight).toBe(35);
		expect(calc.concreteVolume).toBeCloseTo(1.4, 4);
		expect(calc.grossConcreteVolume).toBeCloseTo(2.4, 4);
		expect(calc.hiddenConcreteDeduction).toBeCloseTo(1.0, 4);
	});

	it("لا يُنقص تسليح الكمرة المخفية — الحديد يُحسب بالارتفاع الكامل", () => {
		const hidden = makeBeam({
			quantity: 2,
			width: 60,
			height: 30,
			length: 10.5,
			isHidden: true,
		});
		const dropped = makeBeam({ ...hidden, isHidden: false });

		const hiddenCalc = computeBeamCalc(hidden, "C30", 30);
		const droppedCalc = computeBeamCalc(dropped, "C30", 30);

		expect(hiddenCalc.grossWeight).toBeCloseTo(droppedCalc.grossWeight, 6);
		expect(hiddenCalc.netWeight).toBeCloseTo(droppedCalc.netWeight, 6);
		expect(hiddenCalc.rebarCost).toBeCloseTo(droppedCalc.rebarCost, 6);
	});

	it("يُنقص الشدات للكمرة المخفية ولا يحتسب القاع", () => {
		const beam = makeBeam({
			quantity: 1,
			width: 60,
			height: 30,
			length: 10,
			isHidden: true,
		});
		const calc = computeBeamCalc(beam, "C30", 30);
		// مدفونة كلياً → لا جوانب ولا قاع
		expect(calc.formworkArea).toBeCloseTo(0, 6);
	});

	it("يبقى السلوك كما هو عند عدم تمرير سماكة البلاطة", () => {
		const beam = makeBeam({
			quantity: 1,
			width: 30,
			height: 60,
			length: 5,
			isHidden: false,
		});
		const calc = computeBeamCalc(beam, "C30");
		expect(calc.concreteVolume).toBeCloseTo(0.3 * 0.6 * 5, 4);
	});
});

describe("كل كمرة تُقطَّع منفصلة", () => {
	it("كمرتان بطول 10.5م تعطيان هالكاً مختلفاً عن كمرة واحدة بطول 21م", () => {
		const split = computeBeamCalc(
			makeBeam({ quantity: 2, length: 10.5 }),
			"C30",
		);
		const lumped = computeBeamCalc(
			makeBeam({ quantity: 1, length: 21 }),
			"C30",
		);

		// نفس الطول الكلي لكن التقطيع مختلف: 21م تحتاج وصلات تراكب
		expect(split.grossWeight).not.toBeCloseTo(lumped.grossWeight, 1);
		// الكمرة الملغومة (21م) تتجاوز طول السيخ 12م فتظهر وصلات
		const lumpedSplices = lumped.cuttingDetails.find(
			(d) => (d.splicesPerBar ?? 0) > 0,
		);
		expect(lumpedSplices).toBeDefined();
		// أما 10.5م فتُقطَّع من سيخ واحد بلا وصلات
		expect(
			split.cuttingDetails.every((d) => (d.splicesPerBar ?? 0) === 0),
		).toBe(true);
	});
});
