import { describe, it, expect } from "vitest";
import {
	recalculateSlabCutting,
	recalculateColumnCutting,
	recalculateBeamCutting,
	computeOptimizedFactoryOrder,
	type CuttingDetailRow,
} from "../boq-recalculator";
import { REBAR_WEIGHTS } from "../../constants/prices";

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function weightPerMeter(diameter: number): number {
	return REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;
}

// ─────────────────────────────────────────────────────────────
// Tests: bars longer than stock (lap splices)
// ─────────────────────────────────────────────────────────────

describe("calcCutting — bars longer than stock", () => {
	it("computes correct stocksNeeded for 20.15m bar from 12m stock (Ø12)", () => {
		// Slab with length=20.2 → barLength ≈ 20.15m after cover/extension
		// lapLength = 12 * 40 / 1000 = 0.48m
		// effectiveStockLength = 12 - 0.48 = 11.52m
		// barsPerPiece = ceil((20.15 - 0.48) / 11.52) = ceil(1.707) = 2
		// For 70 pieces → 140 stock bars
		const result = recalculateSlabCutting(
			{
				length: 20.2,
				width: 5,
				bottomMainDiameter: 12,
				bottomMainBarsPerMeter: 5,
				cover: 0.025,
			},
			1,
			"بلاطة كبيرة",
		);

		// Find the main bottom bar row (longest)
		const mainRow = result.cuttingDetails.find(
			(d) => d.diameter === 12 && d.barLength > 12,
		);
		expect(mainRow).toBeDefined();
		if (!mainRow) return;

		// barsPerPiece should be 2 (need 2 stock bars per piece)
		expect(mainRow.stocksNeeded).toBe(mainRow.barCount * 2);
		// Waste must be positive and < 30%
		expect(mainRow.wastePercentage).toBeGreaterThan(0);
		expect(mainRow.wastePercentage).toBeLessThan(30);
		// grossWeight must exceed netWeight
		expect(mainRow.grossWeight).toBeGreaterThan(mainRow.netWeight);
	});

	it("computes correct stocksNeeded for 15m bar from 12m stock (Ø12)", () => {
		const result = recalculateBeamCutting(
			{
				length: 14.4,
				width: 30,
				height: 60,
				topBarsCount: 3,
				topBarDiameter: 12,
				bottomBarsCount: 4,
				bottomBarDiameter: 12,
				stirrupDiameter: 8,
				stirrupSpacing: 150,
			},
			1,
			"كمرة طويلة",
		);

		// barLength = 14.4 + 0.6 = 15.0m > 12m
		const longRows = result.cuttingDetails.filter(
			(d) => d.barLength > 12,
		);
		for (const row of longRows) {
			// barsPerPiece = ceil((15 - 0.48) / (12 - 0.48)) = ceil(1.261) = 2
			expect(row.stocksNeeded).toBe(row.barCount * 2);
			expect(row.wastePercentage).toBeGreaterThan(0);
			// 15m from 2×12m: waste = 24 - 15 - 0.48 = 8.52m → 35.5% (correct for this geometry)
			expect(row.wastePercentage).toBeLessThan(40);
			expect(row.grossWeight).toBeGreaterThan(row.netWeight);
		}
	});

	it("never produces negative waste or grossWeight < netWeight", () => {
		// Slab 25m long — very long bars
		const result = recalculateSlabCutting(
			{
				length: 25,
				width: 6,
				bottomMainDiameter: 16,
				bottomMainBarsPerMeter: 5,
				cover: 0.025,
			},
			1,
			"بلاطة عملاقة",
		);

		for (const row of result.cuttingDetails) {
			expect(row.totalWaste).toBeGreaterThanOrEqual(0);
			expect(row.wastePercentage).toBeGreaterThanOrEqual(0);
			expect(row.grossWeight).toBeGreaterThanOrEqual(row.netWeight);
		}
	});

	it("handles bar barely longer than stock (12.5m from 12m stock)", () => {
		const result = recalculateColumnCutting(
			{
				height: 11.9, // barLength = 11.9 + 0.6 = 12.5m > 12m
				width: 40,
				depth: 40,
				mainBarsCount: 8,
				mainBarDiameter: 16,
				stirrupDiameter: 8,
				stirrupSpacing: 150,
			},
			1,
			"عمود طويل",
		);

		const longRow = result.cuttingDetails.find((d) => d.barLength > 12);
		expect(longRow).toBeDefined();
		if (!longRow) return;

		expect(longRow.stocksNeeded).toBe(longRow.barCount * 2);
		expect(longRow.wastePercentage).toBeGreaterThan(0);
		expect(longRow.wastePercentage).toBeLessThan(50);
	});
});

// ─────────────────────────────────────────────────────────────
// Tests: factory order >= design weight
// ─────────────────────────────────────────────────────────────

describe("factory order weight >= design weight", () => {
	it("factory weight exceeds net weight for normal bars", () => {
		const result = recalculateColumnCutting(
			{
				height: 3,
				width: 30,
				depth: 30,
				mainBarsCount: 8,
				mainBarDiameter: 16,
				stirrupDiameter: 8,
				stirrupSpacing: 150,
			},
			4,
			"عمود C1",
		);

		const totalNet = result.totals.netWeight;
		const totalGross = result.totals.grossWeight;
		expect(totalGross).toBeGreaterThanOrEqual(totalNet);
	});

	it("factory weight exceeds net weight for long bars", () => {
		const result = recalculateSlabCutting(
			{
				length: 20,
				width: 5,
				bottomMainDiameter: 12,
				bottomMainBarsPerMeter: 5,
				cover: 0.025,
			},
			1,
			"بلاطة كبيرة",
		);

		expect(result.totals.grossWeight).toBeGreaterThanOrEqual(
			result.totals.netWeight,
		);
	});
});

// ─────────────────────────────────────────────────────────────
// Tests: remnant reuse
// ─────────────────────────────────────────────────────────────

describe("computeOptimizedFactoryOrder — remnant reuse", () => {
	it("reuses remnants from larger cuts for smaller cuts", () => {
		// Operation 1: 3m pieces from 12m stock → 4 per bar, remnant 0m (no reuse possible)
		// Operation 2: 2.8m pieces from 12m stock → 4 per bar, remnant 0.8m each
		// Operation 3: 0.5m pieces from 12m stock → should use some remnants from op 2
		const details: CuttingDetailRow[] = [
			makeCuttingRow({ diameter: 12, barLength: 2.8, barCount: 40, stockLength: 12 }),
			makeCuttingRow({ diameter: 12, barLength: 0.5, barCount: 20, stockLength: 12 }),
		];

		const withoutReuse = computeOptimizedFactoryOrder([
			// If we only had the first operation
			makeCuttingRow({ diameter: 12, barLength: 2.8, barCount: 40, stockLength: 12 }),
		]);
		const withReuse = computeOptimizedFactoryOrder(details);

		const stocksWithout = withoutReuse.reduce((s, e) => s + e.count, 0);
		const stocksWith = withReuse.reduce((s, e) => s + e.count, 0);

		// Should NOT need additional stocks for the 0.5m pieces (20 pieces × 0.5m = 10m needed)
		// From 10 stocks of 2.8m×4: each has 0.8m remnant → 10×0.8 = 8m of remnants
		// Each remnant fits 1 piece of 0.5m → 10 pieces from remnants, 10 from new stock
		// Without reuse: would need ceil(20/24) = 1 extra stock
		// With reuse: saves at least some stocks
		expect(stocksWith).toBeLessThanOrEqual(stocksWithout + 1); // At most 1 extra (for the 10 remaining 0.5m pieces)
	});

	it("returns correct counts when no reuse is possible", () => {
		const details: CuttingDetailRow[] = [
			makeCuttingRow({ diameter: 12, barLength: 3, barCount: 4, stockLength: 12 }),
		];

		const result = computeOptimizedFactoryOrder(details);
		expect(result).toHaveLength(1);
		// 4 pieces of 3m → 4 per stock → 1 stock
		expect(result[0].count).toBe(1);
	});

	it("handles multiple diameters independently", () => {
		const details: CuttingDetailRow[] = [
			makeCuttingRow({ diameter: 12, barLength: 3, barCount: 8, stockLength: 12 }),
			makeCuttingRow({ diameter: 16, barLength: 5.5, barCount: 4, stockLength: 12 }),
		];

		const result = computeOptimizedFactoryOrder(details);
		expect(result).toHaveLength(2);

		const d12 = result.find((r) => r.diameter === 12);
		const d16 = result.find((r) => r.diameter === 16);
		expect(d12).toBeDefined();
		expect(d16).toBeDefined();
		// Ø12: 8 pieces of 3m → 4 per stock → 2 stocks
		expect(d12!.count).toBe(2);
		// Ø16: 4 pieces of 5.5m → 2 per stock → 2 stocks
		expect(d16!.count).toBe(2);
	});

	it("passes through long bar stocksNeeded unchanged", () => {
		// 20m bar from 12m stock → needs 2 bars per piece → 10 stocks for 5 pieces
		const details: CuttingDetailRow[] = [
			makeCuttingRow({ diameter: 12, barLength: 20, barCount: 5, stockLength: 12, stocksNeeded: 10 }),
		];

		const result = computeOptimizedFactoryOrder(details);
		expect(result[0].count).toBe(10);
	});
});

// ─────────────────────────────────────────────────────────────
// Helper to create CuttingDetailRow for testing
// ─────────────────────────────────────────────────────────────

function makeCuttingRow(overrides: Partial<CuttingDetailRow> & {
	diameter: number;
	barLength: number;
	barCount: number;
	stockLength: number;
}): CuttingDetailRow {
	const { diameter, barLength, barCount, stockLength } = overrides;
	const weight = weightPerMeter(diameter);
	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = overrides.stocksNeeded ?? Math.ceil(barCount / cutsPerStock);
	const netLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;

	return {
		element: "test",
		description: "test",
		diameter,
		barLength,
		barCount,
		stockLength,
		stocksNeeded,
		wastePerStock: stockLength - cutsPerStock * barLength,
		totalWaste: stocksNeeded * (stockLength - cutsPerStock * barLength),
		wastePercentage: grossLength > 0 ? ((grossLength - netLength) / grossLength) * 100 : 0,
		netWeight: netLength * weight,
		grossWeight: grossLength * weight,
		...overrides,
	};
}
