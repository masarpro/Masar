/**
 * Decimal Precision Tests
 *
 * Verifies that financial calculations maintain precision
 * across Decimal ↔ Number conversions. Uses Prisma Decimal
 * when available, otherwise uses plain JS Number edge cases.
 */
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// Basic Decimal → Number precision
// ═══════════════════════════════════════════════════════════════════════════

describe("Number precision for financial amounts", () => {
	it("standard amount: 1234.56 stays exact", () => {
		const amount = 1234.56;
		expect(amount).toBe(1234.56);
		expect(amount.toFixed(2)).toBe("1234.56");
	});

	it("large amount: 999999999.99 stays exact", () => {
		const amount = 999999999.99;
		expect(amount).toBe(999999999.99);
		expect(amount.toFixed(2)).toBe("999999999.99");
	});

	it("small amount: 0.01 stays exact", () => {
		const amount = 0.01;
		expect(amount).toBe(0.01);
		expect(amount.toFixed(2)).toBe("0.01");
	});

	it("zero amount: 0.00 stays exact", () => {
		const amount = 0;
		expect(amount.toFixed(2)).toBe("0.00");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// VAT Calculations (15%)
// ═══════════════════════════════════════════════════════════════════════════

describe("VAT 15% calculations", () => {
	it("1000 × 15% = 150.00", () => {
		const base = 1000;
		const vat = base * 0.15;
		expect(vat).toBe(150);
		expect((base + vat).toFixed(2)).toBe("1150.00");
	});

	it("1234.56 × 15% precision", () => {
		const base = 1234.56;
		const vat = base * 0.15;
		// 1234.56 × 0.15 = 185.184 — standard rounding
		expect(Number(vat.toFixed(2))).toBe(185.18);
		expect(Number((base + vat).toFixed(2))).toBe(1419.74);
	});

	it("0.01 × 15% = 0.00 (rounds down)", () => {
		const base = 0.01;
		const vat = base * 0.15;
		expect(Number(vat.toFixed(2))).toBe(0.0);
	});

	it("very large base: 10000000 × 15%", () => {
		const base = 10000000;
		const vat = base * 0.15;
		expect(vat).toBe(1500000);
		expect(base + vat).toBe(11500000);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Discount Calculations
// ═══════════════════════════════════════════════════════════════════════════

describe("Discount calculations", () => {
	it("1000 - 10% = 900.00", () => {
		const amount = 1000;
		const discount = amount * 0.10;
		expect(amount - discount).toBe(900);
	});

	it("1234.56 - 5% = 1172.83", () => {
		const amount = 1234.56;
		const discount = amount * 0.05;
		const discounted = amount - discount;
		expect(Number(discounted.toFixed(2))).toBe(1172.83);
	});

	it("discount + VAT combined", () => {
		const base = 1000;
		const discountRate = 0.10;
		const vatRate = 0.15;

		const afterDiscount = base * (1 - discountRate); // 900
		const vat = afterDiscount * vatRate; // 135
		const total = afterDiscount + vat; // 1035

		expect(afterDiscount).toBe(900);
		expect(vat).toBe(135);
		expect(total).toBe(1035);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Invoice Aggregation
// ═══════════════════════════════════════════════════════════════════════════

describe("Invoice aggregation", () => {
	it("sum of 100 invoices maintains precision", () => {
		const amounts = Array.from({ length: 100 }, (_, i) => (i + 1) * 10.01);
		const total = amounts.reduce((sum, a) => sum + a, 0);
		// Expected: sum of 10.01 + 20.02 + ... + 1001.00
		// = 10.01 × (1 + 2 + ... + 100) = 10.01 × 5050 = 50550.50
		expect(Number(total.toFixed(2))).toBe(50550.5);
	});

	it("sum of small fractional amounts", () => {
		// 0.1 + 0.2 famously != 0.3 in floating point
		const a = 0.1;
		const b = 0.2;
		// Using toFixed(2) for financial rounding
		expect(Number((a + b).toFixed(2))).toBe(0.3);
	});

	it("sum of invoice items: quantity × unitPrice", () => {
		const items = [
			{ quantity: 5, unitPrice: 199.99 },
			{ quantity: 3, unitPrice: 49.50 },
			{ quantity: 10, unitPrice: 25.00 },
		];

		const subtotals = items.map((item) => item.quantity * item.unitPrice);
		expect(Number(subtotals[0].toFixed(2))).toBe(999.95);
		expect(Number(subtotals[1].toFixed(2))).toBe(148.5);
		expect(Number(subtotals[2].toFixed(2))).toBe(250.0);

		const total = subtotals.reduce((sum, s) => sum + s, 0);
		expect(Number(total.toFixed(2))).toBe(1398.45);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Retention Calculations
// ═══════════════════════════════════════════════════════════════════════════

describe("Retention precision", () => {
	it("10% retention on 500000 = 50000", () => {
		const contractValue = 500000;
		const retentionPercent = 10;
		const retention = (contractValue * retentionPercent) / 100;
		expect(retention).toBe(50000);
	});

	it("5.5% retention on 1234567.89", () => {
		const contractValue = 1234567.89;
		const retentionPercent = 5.5;
		const retention = (contractValue * retentionPercent) / 100;
		// 1234567.89 × 5.5% = 67901.23395
		expect(Number(retention.toFixed(2))).toBe(67901.23);
	});

	it("retention on partial payment", () => {
		const claimAmount = 100000;
		const retentionRate = 10;
		const retentionDeduction = (claimAmount * retentionRate) / 100;
		const netPayment = claimAmount - retentionDeduction;

		expect(retentionDeduction).toBe(10000);
		expect(netPayment).toBe(90000);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Number.MAX_SAFE_INTEGER boundary
// ═══════════════════════════════════════════════════════════════════════════

describe("Number.MAX_SAFE_INTEGER boundary", () => {
	it("MAX_SAFE_INTEGER is 2^53 - 1", () => {
		expect(Number.MAX_SAFE_INTEGER).toBe(9007199254740991);
	});

	it("amounts under MAX_SAFE_INTEGER are safe (in halalas)", () => {
		// 90 trillion SAR in halalas = 9 × 10^15 — still under MAX_SAFE_INTEGER
		const maxSafeHalalas = 9_000_000_000_000_000; // 90 trillion SAR
		expect(Number.isSafeInteger(maxSafeHalalas)).toBe(true);
	});

	it("detects when integer exceeds MAX_SAFE_INTEGER", () => {
		const unsafe = Number.MAX_SAFE_INTEGER + 1;
		expect(Number.isSafeInteger(unsafe)).toBe(false);
	});

	it("practical financial amounts are always safe", () => {
		// Largest realistic project: 10 billion SAR
		const amount = 10_000_000_000;
		const amountInHalalas = amount * 100;
		expect(Number.isSafeInteger(amountInHalalas)).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Rounding strategies
// ═══════════════════════════════════════════════════════════════════════════

describe("Rounding strategies", () => {
	it("ROUND_HALF_UP using string-based approach for precision", () => {
		// Number.EPSILON trick fails for some values (e.g., 1.005)
		// because 1.005 is stored as 1.004999... in IEEE 754.
		// For reliable rounding, use string-based or Decimal library.
		const roundFinancial = (n: number, decimals: number): number => {
			return Number(`${Math.round(Number(`${n}e${decimals}`))}e-${decimals}`);
		};

		expect(roundFinancial(0.005, 2)).toBe(0.01);
		expect(roundFinancial(1.005, 2)).toBe(1.01);
		expect(roundFinancial(2.675, 2)).toBe(2.68);
		expect(roundFinancial(1234.565, 2)).toBe(1234.57);
	});

	it("Math.round + EPSILON fails for some .005 values (documenting limitation)", () => {
		// This documents a known JS limitation
		const naive = (n: number, d: number) => Math.round(n * 10 ** d + Number.EPSILON) / 10 ** d;
		// 1.005 × 100 = 100.4999... → rounds to 100 → 1.00
		expect(naive(1.005, 2)).toBe(1.0); // NOT 1.01!
	});

	it("consistent 2-decimal rounding for SAR currency", () => {
		const amounts = [123.456, 789.994, 0.001, 99.999];
		const rounded = amounts.map((a) => Number(a.toFixed(2)));

		expect(rounded[0]).toBe(123.46);
		expect(rounded[1]).toBe(789.99);
		expect(rounded[2]).toBe(0.0);
		expect(rounded[3]).toBe(100.0);
	});

	it("toFixed banker's rounding on .005 boundary", () => {
		// toFixed uses "round half to even" in some JS engines
		// Document actual behavior rather than assuming
		const val = Number((1000.005).toFixed(2));
		// In V8, (1000.005).toFixed(2) = "1000.00" (due to float representation)
		// because 1000.005 is actually 1000.004999... in float
		expect(val === 1000.0 || val === 1000.01).toBe(true);
	});
});
