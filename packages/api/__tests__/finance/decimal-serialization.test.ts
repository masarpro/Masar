import { describe, expect, it } from "vitest";

import { serializeDecimals } from "../../lib/decimal-helpers";

/**
 * نسخة مطابقة لبنية decimal.js التي يعيدها Prisma لحقول @db.Decimal:
 * s (الإشارة) و e (الأس) و d (مصفوفة الأرقام) مع toNumber/toFixed، وvalueOf
 * حتى يعمل Number(). الكشف في serializeDecimals يقوم على هذه البنية نفسها،
 * فاختبارها هنا يختبر ما يجري فعلاً على مخرجات Prisma.
 */
class Decimal {
	readonly s: number;
	readonly e: number;
	readonly d: number[];
	private readonly value: number;

	constructor(input: string | number) {
		this.value = Number(input);
		this.s = this.value < 0 ? -1 : 1;
		this.e = Math.floor(Math.log10(Math.abs(this.value) || 1));
		this.d = String(Math.abs(this.value))
			.replace(".", "")
			.split("")
			.map(Number);
	}

	toNumber(): number {
		return this.value;
	}
	toFixed(digits?: number): string {
		return this.value.toFixed(digits);
	}
	valueOf(): number {
		return this.value;
	}
	toString(): string {
		return String(this.value);
	}
	toJSON(): string {
		return String(this.value);
	}
}

// ═══════════════════════════════════════════════════════════════
// serializeDecimals — شبكة الأمان على مخرجات كل إجراء RPC
// ───────────────────────────────────────────────────────────────
// بدونها يخرج أي حقل Decimal غير مُغطّى بدالة تحويل مسماة: نصاً عبر
// HTTP وكائناً عبر نداء SSR داخل العملية (فتحذّر React عند تمريره
// لمكوّن عميل). الاختبارات تثبّت أن المسارين يخرجان بأرقام.
// ═══════════════════════════════════════════════════════════════

describe("serializeDecimals", () => {
	it("converts a top-level Decimal to a number", () => {
		const out = serializeDecimals({ total: new Decimal("1234.56") });
		expect(out.total).toBe(1234.56);
		expect(typeof out.total).toBe("number");
	});

	it("converts Decimals nested in objects and arrays", () => {
		const out = serializeDecimals({
			study: {
				globalMarkupPercent: new Decimal("12.5"),
				sectionMarkups: [
					{ section: "STRUCTURAL", markupPercent: new Decimal("8") },
					{ section: "FINISHING", markupPercent: new Decimal("10.25") },
				],
			},
		});

		expect(out.study.globalMarkupPercent).toBe(12.5);
		expect(out.study.sectionMarkups[0].markupPercent).toBe(8);
		expect(out.study.sectionMarkups[1].markupPercent).toBe(10.25);
	});

	it("keeps everything else untouched", () => {
		const date = new Date("2026-07-28T00:00:00.000Z");
		const out = serializeDecimals({
			id: "abc",
			count: 3,
			enabled: true,
			missing: null,
			absent: undefined,
			createdAt: date,
			dimensions: { width: 30, label: "ع1" },
			tags: ["a", "b"],
		});

		expect(out.id).toBe("abc");
		expect(out.count).toBe(3);
		expect(out.enabled).toBe(true);
		expect(out.missing).toBeNull();
		expect(out.absent).toBeUndefined();
		expect(out.createdAt).toBe(date);
		expect(out.dimensions).toEqual({ width: 30, label: "ع1" });
		expect(out.tags).toEqual(["a", "b"]);
	});

	// تجنّب تخصيص ذاكرة بلا داعٍ على كل استجابة
	it("returns the same reference when there is nothing to convert", () => {
		const input = { id: "x", nested: { a: 1 }, list: [1, 2, 3] };
		expect(serializeDecimals(input)).toBe(input);
	});

	it("only rebuilds the branches that changed", () => {
		const untouched = { a: 1 };
		const input = { untouched, priced: { total: new Decimal("5") } };
		const out = serializeDecimals(input);

		expect(out).not.toBe(input);
		expect(out.untouched).toBe(untouched);
		expect(out.priced.total).toBe(5);
	});

	it("passes primitives and nullish values through", () => {
		expect(serializeDecimals(null)).toBeNull();
		expect(serializeDecimals(undefined)).toBeUndefined();
		expect(serializeDecimals(7)).toBe(7);
		expect(serializeDecimals("نص")).toBe("نص");
	});

	it("preserves precision for values a float can hold", () => {
		const out = serializeDecimals({ amount: new Decimal("999999999.99") });
		expect(out.amount).toBe(999999999.99);
	});
});
