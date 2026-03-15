import { describe, it, expect, vi } from "vitest";
import { validateStructuralBounds } from "../../../modules/quantities/validators/structural-bounds";

describe("validateStructuralBounds", () => {
	it("accepts normal values", () => {
		expect(() =>
			validateStructuralBounds({
				category: "foundations",
				quantity: 10,
				concreteVolume: 50,
				steelWeight: 200,
				dimensions: { length: 2, width: 1.5, height: 0.6 },
			}),
		).not.toThrow();
	});

	it("rejects quantity <= 0", () => {
		expect(() =>
			validateStructuralBounds({ quantity: 0 }),
		).toThrow("exceeds allowed bounds");

		expect(() =>
			validateStructuralBounds({ quantity: -5 }),
		).toThrow("exceeds allowed bounds");
	});

	it("rejects negative concreteVolume", () => {
		expect(() =>
			validateStructuralBounds({ concreteVolume: -1 }),
		).toThrow("exceeds allowed bounds");
	});

	it("rejects concreteVolume exceeding max", () => {
		expect(() =>
			validateStructuralBounds({ concreteVolume: 60000 }),
		).toThrow("exceeds allowed bounds");
	});

	it("rejects negative steelWeight", () => {
		expect(() =>
			validateStructuralBounds({ steelWeight: -10 }),
		).toThrow("exceeds allowed bounds");
	});

	it("rejects steelWeight exceeding max", () => {
		expect(() =>
			validateStructuralBounds({ steelWeight: 600000 }),
		).toThrow("exceeds allowed bounds");
	});

	it("rejects negative dimensions", () => {
		expect(() =>
			validateStructuralBounds({
				dimensions: { length: -1, width: 2 },
			}),
		).toThrow("exceeds allowed bounds");
	});

	it("warns on high steel ratio but does not throw", () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(() =>
			validateStructuralBounds({
				category: "columns",
				quantity: 1,
				concreteVolume: 1,       // 1 م³
				steelWeight: 1000,       // ratio ~12.7% > 8%
			}),
		).not.toThrow();
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("High steel ratio"),
		);
		consoleSpy.mockRestore();
	});

	it("warns on high quantity but does not throw", () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(() =>
			validateStructuralBounds({
				category: "blocks",
				quantity: 200000,
			}),
		).not.toThrow();
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("High quantity"),
		);
		consoleSpy.mockRestore();
	});

	it("collects multiple errors into one throw", () => {
		expect(() =>
			validateStructuralBounds({
				quantity: -1,
				concreteVolume: -5,
				steelWeight: -10,
			}),
		).toThrow("exceeds allowed bounds");
	});
});
