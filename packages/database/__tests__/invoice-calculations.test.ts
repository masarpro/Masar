/**
 * Invoice Calculation Tests — ZATCA Phase 1 Compliance
 *
 * Tests for calculateInvoiceTotals() — the single source of truth for
 * invoice amount calculations using Prisma.Decimal with ROUND_HALF_UP.
 *
 * These are pure-function tests that do NOT require a database connection.
 */

import { describe, it, expect } from "vitest";
import { Prisma } from "../prisma/generated/client";
import { calculateInvoiceTotals } from "../prisma/queries/finance";

// Helper to convert Decimal result to number for easier assertion
const toNum = (d: Prisma.Decimal) => d.toNumber();

describe("calculateInvoiceTotals", () => {
	// ═══════════════════════════════════════════════════════════════════════
	// Basic calculations
	// ═══════════════════════════════════════════════════════════════════════

	describe("basic calculations", () => {
		it("single item, no discount, 15% VAT", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 100 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(100);
			expect(toNum(result.discountAmount)).toBe(0);
			expect(toNum(result.afterDiscount)).toBe(100);
			expect(toNum(result.vatAmount)).toBe(15);
			expect(toNum(result.totalAmount)).toBe(115);
			expect(result.itemTotals).toHaveLength(1);
			expect(toNum(result.itemTotals[0])).toBe(100);
		});

		it("multiple items, no discount, 15% VAT", () => {
			const result = calculateInvoiceTotals(
				[
					{ quantity: 2, unitPrice: 50 },
					{ quantity: 3, unitPrice: 100 },
					{ quantity: 1, unitPrice: 250 },
				],
				0,
				15,
			);

			// subtotal = 100 + 300 + 250 = 650
			expect(toNum(result.subtotal)).toBe(650);
			expect(toNum(result.discountAmount)).toBe(0);
			expect(toNum(result.vatAmount)).toBe(97.5);
			expect(toNum(result.totalAmount)).toBe(747.5);
			expect(result.itemTotals).toHaveLength(3);
			expect(toNum(result.itemTotals[0])).toBe(100);
			expect(toNum(result.itemTotals[1])).toBe(300);
			expect(toNum(result.itemTotals[2])).toBe(250);
		});

		it("handles zero quantity item", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 0, unitPrice: 500 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(0);
		});

		it("handles zero price item", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 10, unitPrice: 0 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(0);
		});

		it("handles empty items array", () => {
			const result = calculateInvoiceTotals([], 0, 15);

			expect(toNum(result.subtotal)).toBe(0);
			expect(toNum(result.discountAmount)).toBe(0);
			expect(toNum(result.vatAmount)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(0);
			expect(result.itemTotals).toHaveLength(0);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Discount scenarios
	// ═══════════════════════════════════════════════════════════════════════

	describe("discount scenarios", () => {
		it("0% discount", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				0,
				15,
			);

			expect(toNum(result.discountAmount)).toBe(0);
			expect(toNum(result.afterDiscount)).toBe(1000);
			expect(toNum(result.vatAmount)).toBe(150);
			expect(toNum(result.totalAmount)).toBe(1150);
		});

		it("10% discount", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				10,
				15,
			);

			// discount = 100, after = 900, vat = 135, total = 1035
			expect(toNum(result.discountAmount)).toBe(100);
			expect(toNum(result.afterDiscount)).toBe(900);
			expect(toNum(result.vatAmount)).toBe(135);
			expect(toNum(result.totalAmount)).toBe(1035);
		});

		it("50% discount", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				50,
				15,
			);

			// discount = 500, after = 500, vat = 75, total = 575
			expect(toNum(result.discountAmount)).toBe(500);
			expect(toNum(result.afterDiscount)).toBe(500);
			expect(toNum(result.vatAmount)).toBe(75);
			expect(toNum(result.totalAmount)).toBe(575);
		});

		it("100% discount", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				100,
				15,
			);

			expect(toNum(result.discountAmount)).toBe(1000);
			expect(toNum(result.afterDiscount)).toBe(0);
			expect(toNum(result.vatAmount)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(0);
		});

		it("VAT is calculated on post-discount amount", () => {
			// Critical: VAT must be on (subtotal - discount), NOT on subtotal
			const result = calculateInvoiceTotals(
				[{ quantity: 4, unitPrice: 250 }], // subtotal = 1000
				20,  // 20% discount = 200, after = 800
				15,  // 15% VAT on 800 = 120
			);

			expect(toNum(result.subtotal)).toBe(1000);
			expect(toNum(result.discountAmount)).toBe(200);
			expect(toNum(result.afterDiscount)).toBe(800);
			expect(toNum(result.vatAmount)).toBe(120);
			expect(toNum(result.totalAmount)).toBe(920);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// VAT scenarios
	// ═══════════════════════════════════════════════════════════════════════

	describe("VAT scenarios", () => {
		it("15% VAT (Saudi standard)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 200 }],
				0,
				15,
			);

			expect(toNum(result.vatAmount)).toBe(30);
			expect(toNum(result.totalAmount)).toBe(230);
		});

		it("0% VAT (exempt)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				0,
				0,
			);

			expect(toNum(result.vatAmount)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(1000);
		});

		it("5% VAT", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				0,
				5,
			);

			expect(toNum(result.vatAmount)).toBe(50);
			expect(toNum(result.totalAmount)).toBe(1050);
		});

		it("uses default 15% VAT when not specified", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 100 }],
			);

			expect(toNum(result.vatAmount)).toBe(15);
			expect(toNum(result.totalAmount)).toBe(115);
		});

		it("uses default 0% discount when not specified", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 100 }],
			);

			expect(toNum(result.discountAmount)).toBe(0);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Rounding: ROUND_HALF_UP to 2 decimal places
	// ═══════════════════════════════════════════════════════════════════════

	describe("rounding", () => {
		it("rounds .005 UP (ROUND_HALF_UP)", () => {
			// 33.33... × 3 items = 99.99 subtotal (each item = 33.33)
			// Actually: item total = 1 * 33.335 = 33.34 (rounded)
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 33.335 }],
				0,
				0,
			);

			// 33.335 → 33.34 (ROUND_HALF_UP)
			expect(toNum(result.subtotal)).toBe(33.34);
		});

		it("rounds item total to 2 decimal places", () => {
			// 3 × 33.33 = 99.99 exactly
			const result = calculateInvoiceTotals(
				[{ quantity: 3, unitPrice: 33.33 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(99.99);
			// VAT = 99.99 * 0.15 = 14.9985 → 15.00
			expect(toNum(result.vatAmount)).toBe(15);
			expect(toNum(result.totalAmount)).toBe(114.99);
		});

		it("rounds discount amount to 2 decimal places", () => {
			// subtotal = 333.33, discount 7% = 23.3331 → 23.33
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 333.33 }],
				7,
				15,
			);

			expect(toNum(result.discountAmount)).toBe(23.33);
			// after discount = 333.33 - 23.33 = 310.00
			expect(toNum(result.afterDiscount)).toBe(310);
		});

		it("rounds VAT amount to 2 decimal places", () => {
			// subtotal = 100.01, VAT 15% = 15.0015 → 15.00
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 100.01 }],
				0,
				15,
			);

			expect(toNum(result.vatAmount)).toBe(15);
			expect(toNum(result.totalAmount)).toBe(115.01);
		});

		it("handles thirds correctly (1/3 pricing)", () => {
			// A common scenario: price that creates repeating decimals
			// 100 / 3 = 33.333...
			// If someone enters unitPrice = 33.33 and qty = 3:
			const result = calculateInvoiceTotals(
				[{ quantity: 3, unitPrice: 33.33 }],
				0,
				0,
			);

			// 3 * 33.33 = 99.99
			expect(toNum(result.subtotal)).toBe(99.99);
			expect(toNum(result.totalAmount)).toBe(99.99);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Fractional quantities
	// ═══════════════════════════════════════════════════════════════════════

	describe("fractional quantities", () => {
		it("handles 0.5 quantity (half meter)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 0.5, unitPrice: 100 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(50);
			expect(toNum(result.vatAmount)).toBe(7.5);
			expect(toNum(result.totalAmount)).toBe(57.5);
		});

		it("handles 2.75 quantity", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 2.75, unitPrice: 40 }],
				0,
				15,
			);

			// 2.75 * 40 = 110
			expect(toNum(result.subtotal)).toBe(110);
			expect(toNum(result.vatAmount)).toBe(16.5);
			expect(toNum(result.totalAmount)).toBe(126.5);
		});

		it("handles small fractional quantity (0.01)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 0.01, unitPrice: 1000 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(10);
			expect(toNum(result.vatAmount)).toBe(1.5);
			expect(toNum(result.totalAmount)).toBe(11.5);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Decimal unit prices
	// ═══════════════════════════════════════════════════════════════════════

	describe("decimal unit prices", () => {
		it("handles decimal unit price (12.50)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 4, unitPrice: 12.5 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(50);
			expect(toNum(result.vatAmount)).toBe(7.5);
			expect(toNum(result.totalAmount)).toBe(57.5);
		});

		it("handles small unit price (0.99)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 100, unitPrice: 0.99 }],
				0,
				15,
			);

			// 100 * 0.99 = 99
			expect(toNum(result.subtotal)).toBe(99);
			expect(toNum(result.vatAmount)).toBe(14.85);
			expect(toNum(result.totalAmount)).toBe(113.85);
		});

		it("handles very precise unit price (123.456)", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 123.456 }],
				0,
				0,
			);

			// 1 * 123.456 = 123.46 (rounded to 2dp HALF_UP)
			expect(toNum(result.subtotal)).toBe(123.46);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Large amounts
	// ═══════════════════════════════════════════════════════════════════════

	describe("large amounts", () => {
		it("handles millions correctly", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 5_000_000 }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(5_000_000);
			expect(toNum(result.vatAmount)).toBe(750_000);
			expect(toNum(result.totalAmount)).toBe(5_750_000);
		});

		it("handles large quantities with decimal prices", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 10_000, unitPrice: 99.99 }],
				5,
				15,
			);

			// subtotal = 10000 * 99.99 = 999900
			// discount = 999900 * 5/100 = 49995
			// after = 999900 - 49995 = 949905
			// vat = 949905 * 15/100 = 142485.75
			// total = 949905 + 142485.75 = 1092390.75
			expect(toNum(result.subtotal)).toBe(999_900);
			expect(toNum(result.discountAmount)).toBe(49_995);
			expect(toNum(result.afterDiscount)).toBe(949_905);
			expect(toNum(result.vatAmount)).toBe(142_485.75);
			expect(toNum(result.totalAmount)).toBe(1_092_390.75);
		});

		it("handles many items", () => {
			// 20 items at different prices
			const items = Array.from({ length: 20 }, (_, i) => ({
				quantity: i + 1,
				unitPrice: (i + 1) * 10,
			}));
			// Sum: 1*10 + 2*20 + 3*30 + ... + 20*200
			// = 10 + 40 + 90 + ... + 4000
			const expectedSubtotal = items.reduce(
				(sum, item) => sum + item.quantity * item.unitPrice,
				0,
			);

			const result = calculateInvoiceTotals(items, 0, 15);

			expect(toNum(result.subtotal)).toBe(expectedSubtotal);
			expect(result.itemTotals).toHaveLength(20);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Prisma.Decimal input
	// ═══════════════════════════════════════════════════════════════════════

	describe("Prisma.Decimal input", () => {
		it("accepts Prisma.Decimal for quantity and price", () => {
			const result = calculateInvoiceTotals(
				[{
					quantity: new Prisma.Decimal("2.5"),
					unitPrice: new Prisma.Decimal("100.50"),
				}],
				new Prisma.Decimal("10"),
				new Prisma.Decimal("15"),
			);

			// subtotal = 2.5 * 100.50 = 251.25
			// discount = 251.25 * 10 / 100 = 25.13 (rounded)
			// after = 251.25 - 25.13 = 226.12
			// vat = 226.12 * 15 / 100 = 33.92 (rounded)
			// total = 226.12 + 33.92 = 260.04
			expect(toNum(result.subtotal)).toBe(251.25);
			expect(toNum(result.discountAmount)).toBe(25.13);
			expect(toNum(result.afterDiscount)).toBe(226.12);
			expect(toNum(result.vatAmount)).toBe(33.92);
			expect(toNum(result.totalAmount)).toBe(260.04);
		});

		it("mixes number and Decimal inputs", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 3, unitPrice: new Prisma.Decimal("33.33") }],
				0,
				15,
			);

			expect(toNum(result.subtotal)).toBe(99.99);
		});
	});

	// ═══════════════════════════════════════════════════════════════════════
	// Combined discount + VAT edge cases
	// ═══════════════════════════════════════════════════════════════════════

	describe("combined edge cases", () => {
		it("discount + 0% VAT", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 1, unitPrice: 1000 }],
				10,
				0,
			);

			expect(toNum(result.discountAmount)).toBe(100);
			expect(toNum(result.vatAmount)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(900);
		});

		it("100% discount + 15% VAT = 0 total", () => {
			const result = calculateInvoiceTotals(
				[{ quantity: 5, unitPrice: 200 }],
				100,
				15,
			);

			expect(toNum(result.subtotal)).toBe(1000);
			expect(toNum(result.discountAmount)).toBe(1000);
			expect(toNum(result.afterDiscount)).toBe(0);
			expect(toNum(result.vatAmount)).toBe(0);
			expect(toNum(result.totalAmount)).toBe(0);
		});

		it("real-world construction invoice scenario", () => {
			// Typical Saudi construction invoice
			const result = calculateInvoiceTotals(
				[
					{ quantity: 150, unitPrice: 85 },      // concrete m³
					{ quantity: 2500, unitPrice: 12.5 },    // rebar kg
					{ quantity: 45, unitPrice: 350 },       // labor days
					{ quantity: 1, unitPrice: 8500 },       // equipment lump sum
				],
				5,   // 5% discount
				15,  // 15% VAT
			);

			// subtotal = 12750 + 31250 + 15750 + 8500 = 68250
			// discount = 68250 * 5% = 3412.50
			// after = 68250 - 3412.50 = 64837.50
			// vat = 64837.50 * 15% = 9725.63 (rounded)
			// total = 64837.50 + 9725.63 = 74563.13
			expect(toNum(result.subtotal)).toBe(68250);
			expect(toNum(result.discountAmount)).toBe(3412.5);
			expect(toNum(result.afterDiscount)).toBe(64837.5);
			expect(toNum(result.vatAmount)).toBe(9725.63);
			expect(toNum(result.totalAmount)).toBe(74563.13);
		});
	});
});
