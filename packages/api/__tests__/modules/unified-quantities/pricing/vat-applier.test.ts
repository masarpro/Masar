import { describe, it, expect } from "vitest";
import { applyVAT } from "../../../../modules/unified-quantities/pricing/vat-applier";

describe("applyVAT", () => {
	describe("VAT excluded (default — VAT is added)", () => {
		it("adds 15% to a 100 SAR net amount", () => {
			const r = applyVAT(100, 15, false);
			expect(r.netAmount).toBe(100);
			expect(r.vatAmount).toBeCloseTo(15, 2);
			expect(r.grossAmount).toBeCloseTo(115, 2);
		});

		it("uses 15% as default vatPercent", () => {
			const r = applyVAT(200);
			expect(r.vatAmount).toBeCloseTo(30, 2);
			expect(r.grossAmount).toBeCloseTo(230, 2);
		});

		it("works with 0% VAT (no change)", () => {
			const r = applyVAT(100, 0);
			expect(r.netAmount).toBe(100);
			expect(r.vatAmount).toBe(0);
			expect(r.grossAmount).toBe(100);
		});

		it("works with custom percent (5% Bahrain)", () => {
			const r = applyVAT(100, 5);
			expect(r.vatAmount).toBeCloseTo(5, 2);
			expect(r.grossAmount).toBeCloseTo(105, 2);
		});
	});

	describe("VAT included (extracts net from gross)", () => {
		it("extracts net from 115 SAR gross at 15%", () => {
			const r = applyVAT(115, 15, true);
			expect(r.netAmount).toBeCloseTo(100, 2);
			expect(r.vatAmount).toBeCloseTo(15, 2);
			expect(r.grossAmount).toBe(115);
		});

		it("net + vat = gross (round-trip integrity within 0.01)", () => {
			const r = applyVAT(100, 15, true);
			expect(r.netAmount + r.vatAmount).toBeCloseTo(r.grossAmount, 2);
		});

		it("100 SAR included → net ≈ 86.96, vat ≈ 13.04", () => {
			const r = applyVAT(100, 15, true);
			expect(r.netAmount).toBeCloseTo(86.96, 2);
			expect(r.vatAmount).toBeCloseTo(13.04, 2);
		});

		it("works with 0% VAT (gross = net)", () => {
			const r = applyVAT(100, 0, true);
			expect(r.netAmount).toBe(100);
			expect(r.vatAmount).toBe(0);
			expect(r.grossAmount).toBe(100);
		});
	});

	describe("validation", () => {
		it("throws on negative vatPercent", () => {
			expect(() => applyVAT(100, -5)).toThrow(/يجب أن تكون بين 0 و 100/);
		});

		it("throws on vatPercent > 100", () => {
			expect(() => applyVAT(100, 150)).toThrow();
		});

		it("throws on NaN vatPercent", () => {
			expect(() => applyVAT(100, NaN)).toThrow();
		});

		it("returns zeros for NaN amount", () => {
			const r = applyVAT(NaN, 15);
			expect(r.netAmount).toBe(0);
			expect(r.vatAmount).toBe(0);
			expect(r.grossAmount).toBe(0);
		});
	});

	describe("round-trip integrity", () => {
		it("excluded → included round-trip preserves gross", () => {
			// نصاف ر.س net، أضِف VAT، استخرج VAT من النتيجة الـ gross، يجب نفس الـ net
			const step1 = applyVAT(500, 15, false);
			const step2 = applyVAT(step1.grossAmount, 15, true);
			expect(step2.netAmount).toBeCloseTo(500, 2);
			expect(step2.vatAmount).toBeCloseTo(step1.vatAmount, 2);
		});
	});
});
