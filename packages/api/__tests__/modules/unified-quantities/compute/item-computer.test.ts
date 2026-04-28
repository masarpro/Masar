import { describe, it, expect } from "vitest";
import { compute } from "../../../../modules/unified-quantities/compute/item-computer";

// ════════════════════════════════════════════════════════════
// item-computer (the coordinator) — dispatch + integration
// ════════════════════════════════════════════════════════════

describe("compute (coordinator)", () => {
	describe("method dispatch", () => {
		it("dispatches direct_area", () => {
			const r = compute({
				item: { calculationMethod: "direct_area", primaryValue: 50, wastagePercent: 0 },
			});
			expect(r.breakdown.type).toBe("direct_area");
			expect(r.computedQuantity).toBe(50);
		});

		it("dispatches length_x_height", () => {
			const r = compute({
				item: {
					calculationMethod: "length_x_height",
					primaryValue: 4,
					secondaryValue: 3,
					wastagePercent: 0,
				},
			});
			expect(r.breakdown.type).toBe("length_x_height");
			expect(r.computedQuantity).toBe(12);
		});

		it("dispatches length_only", () => {
			expect(
				compute({
					item: { calculationMethod: "length_only", primaryValue: 25, wastagePercent: 0 },
				}).breakdown.type,
			).toBe("length_only");
		});

		it("dispatches per_unit", () => {
			expect(
				compute({
					item: { calculationMethod: "per_unit", primaryValue: 10, wastagePercent: 0 },
				}).breakdown.type,
			).toBe("per_unit");
		});

		it("dispatches per_room", () => {
			expect(
				compute({
					item: {
						calculationMethod: "per_room",
						primaryValue: 4,
						secondaryValue: 5,
						wastagePercent: 0,
					},
				}).breakdown.type,
			).toBe("per_room");
		});

		it("dispatches polygon", () => {
			expect(
				compute({
					item: {
						calculationMethod: "polygon",
						polygonPoints: [
							{ x: 0, y: 0 },
							{ x: 10, y: 0 },
							{ x: 10, y: 10 },
							{ x: 0, y: 10 },
						],
						wastagePercent: 0,
					},
				}).breakdown.type,
			).toBe("polygon");
		});

		it("dispatches manual", () => {
			expect(
				compute({
					item: { calculationMethod: "manual", primaryValue: 42, wastagePercent: 0 },
				}).breakdown.type,
			).toBe("manual");
		});

		it("dispatches lump_sum", () => {
			expect(compute({ item: { calculationMethod: "lump_sum" } }).breakdown.type).toBe(
				"lump_sum",
			);
		});

		it("throws on unknown method", () => {
			expect(() =>
				compute({
					item: { calculationMethod: "unknown_method" as never, primaryValue: 1 },
				}),
			).toThrow(/طريقة حساب غير معروفة/);
		});
	});

	describe("linked-item priority", () => {
		it("uses link-resolver when linkedFromItemId + linkedFromItem present", () => {
			const r = compute({
				item: {
					calculationMethod: "direct_area",
					primaryValue: 999, // ignored — link takes priority
					linkedFromItemId: "src-1",
					linkQuantityFormula: "SAME",
					wastagePercent: 0,
				},
				linkedFromItem: { effectiveQuantity: 100 },
			});
			expect(r.computedQuantity).toBe(100); // from source, not 999
			expect(r.breakdown.type).toBe("linked:SAME");
		});

		it("falls through to method when linkedFromItem is null", () => {
			const r = compute({
				item: {
					calculationMethod: "direct_area",
					primaryValue: 50,
					linkedFromItemId: "src-1",
					wastagePercent: 0,
				},
				linkedFromItem: null, // no source available
			});
			expect(r.computedQuantity).toBe(50); // from method, not link
			expect(r.breakdown.type).toBe("direct_area");
		});
	});

	// ──────────────────────────────────────────────────────────────
	// Integration scenarios — real Saudi-construction examples
	// ──────────────────────────────────────────────────────────────
	describe("integration scenarios", () => {
		it("paint linked from plaster with wet-area deduction + 10% wastage", () => {
			// لياسة داخلية 100 م² + مطبخ بمساحة جدار 15 م² (wet)
			// دهان مرتبط MINUS_WET_AREAS، هدر 10%
			// المتوقع: (100 − 15) × 1.10 = 93.5
			const r = compute({
				item: {
					calculationMethod: "direct_area",
					linkedFromItemId: "plaster-1",
					linkQuantityFormula: "MINUS_WET_AREAS",
					wastagePercent: 10,
				},
				linkedFromItem: { effectiveQuantity: 100 },
				context: {
					spaces: [
						{ isWetArea: true, computedWallArea: 15 },
						{ isWetArea: false, computedWallArea: 50 },
					],
				},
			});
			expect(r.computedQuantity).toBe(85);
			expect(r.effectiveQuantity).toBeCloseTo(93.5, 4);
			expect(r.breakdown.type).toBe("linked:MINUS_WET_AREAS");
		});

		it("bathroom ceramic wall: length × height with door + window deducted", () => {
			// حمام محيطه 12 م × ارتفاع 2.7 م = 32.4 م²
			// خصم باب 0.9×2.1 (1.89) + شباك 0.5×0.5 (0.25) = 2.14
			// صافي: 30.26 م² × 1.10 (هدر) = 33.286
			const r = compute({
				item: {
					calculationMethod: "length_x_height",
					primaryValue: 12,
					secondaryValue: 2.7,
					deductOpenings: true,
					wastagePercent: 10,
				},
				openings: [
					{ computedArea: 1.89, count: 1 },
					{ computedArea: 0.25, count: 1 },
				] as never,
			});
			expect(r.computedQuantity).toBeCloseTo(30.26, 4);
			expect(r.effectiveQuantity).toBeCloseTo(33.286, 3);
		});

		it("villa electrical outlets: 4 per room × 5 rooms = 20 outlets, 5% wastage", () => {
			const r = compute({
				item: {
					calculationMethod: "per_room",
					primaryValue: 4,
					secondaryValue: 5,
					wastagePercent: 5,
				},
			});
			expect(r.computedQuantity).toBe(20);
			expect(r.effectiveQuantity).toBeCloseTo(21, 4);
		});

		it("L-shape living room polygon: 84 m² with 12% wastage = 94.08", () => {
			const r = compute({
				item: {
					calculationMethod: "polygon",
					polygonPoints: [
						{ x: 0, y: 0 },
						{ x: 10, y: 0 },
						{ x: 10, y: 6 },
						{ x: 6, y: 6 },
						{ x: 6, y: 10 },
						{ x: 0, y: 10 },
					],
					wastagePercent: 12,
				},
			});
			expect(r.computedQuantity).toBe(84);
			expect(r.effectiveQuantity).toBeCloseTo(94.08, 4);
		});

		it("breakdown.steps fully populated for direct_area", () => {
			const r = compute({
				item: {
					calculationMethod: "direct_area",
					primaryValue: 100,
					wastagePercent: 10,
					deductOpenings: true,
				},
				openings: [{ computedArea: 5, count: 2 } as never],
			});
			expect(r.breakdown.steps).toContain("المساحة المُدخلة: 100");
			expect(r.breakdown.steps.some((s) => s.includes("الفتحات المخصومة: 10"))).toBe(true);
			expect(r.breakdown.steps.some((s) => s.includes("الكمية الفعّالة"))).toBe(true);
		});

		it("ContextOpening with string Decimal serialization works end-to-end", () => {
			// مدخلات كلها strings (مثل ما تأتي من Prisma JSON serialization)
			const r = compute({
				item: {
					calculationMethod: "length_x_height",
					primaryValue: "8" as never,
					secondaryValue: "2.7" as never,
					wastagePercent: "10" as never,
					deductOpenings: true,
				},
				openings: [{ computedArea: "1.89" as never, count: 1 }],
			});
			// 8×2.7 = 21.6 - 1.89 = 19.71 ×1.10 = 21.681
			expect(r.computedQuantity).toBeCloseTo(19.71, 4);
			expect(r.effectiveQuantity).toBeCloseTo(21.681, 3);
		});
	});
});
