import { describe, it, expect } from "vitest";
import { optimizedCutting } from "../cutting/cutting-optimizer";

describe("optimizedCutting", () => {
	it("produces patterns for simple single-length cuts", () => {
		const result = optimizedCutting({
			diameter: 12,
			pieces: [
				{ id: "bar-1", length: 3, quantity: 10 },
			],
			stockLengths: [12],
		});

		expect(result.totalBars).toBeGreaterThanOrEqual(3);
		expect(result.patterns.length).toBeGreaterThan(0);
		expect(result.totalNetLength).toBeCloseTo(30, 0);
		expect(result.totalGrossLength).toBeGreaterThanOrEqual(30);
	});

	it("handles multiple piece lengths", () => {
		const result = optimizedCutting({
			diameter: 16,
			pieces: [
				{ id: "top", length: 5.6, quantity: 6 },
				{ id: "bot", length: 5.6, quantity: 8 },
				{ id: "stir", length: 1.5, quantity: 34 },
			],
			stockLengths: [12],
		});

		expect(result.totalBars).toBeGreaterThan(0);
		expect(result.totalNetLength).toBeGreaterThan(0);
		expect(result.totalGrossLength).toBeGreaterThanOrEqual(result.totalNetLength);
		expect(result.wastePercentage).toBeGreaterThanOrEqual(0);
	});

	it("handles pieces longer than stock (lap splices)", () => {
		const result = optimizedCutting({
			diameter: 16,
			pieces: [
				{ id: "long-bar", length: 15, quantity: 4 },
			],
			stockLengths: [12],
		});

		// Needs splicing — more bars than pieces
		expect(result.totalBars).toBeGreaterThan(4);
		expect(result.hasLongSpans).toBe(true);
	});

	it("handles exactly fitting pieces", () => {
		const result = optimizedCutting({
			diameter: 12,
			pieces: [
				{ id: "exact", length: 6, quantity: 2 },
			],
			stockLengths: [12],
		});

		// Should need at least 1 bar; optimizer may add blade width
		expect(result.totalBars).toBeGreaterThanOrEqual(1);
		expect(result.totalNetLength).toBeCloseTo(12, 0);
	});
});
