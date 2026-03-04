/**
 * Sequence Generation Tests
 *
 * Pure-function tests for formatSequenceNo().
 * No database connection required.
 */
import { describe, it, expect } from "vitest";
import { formatSequenceNo } from "../prisma/queries/sequences";

describe("formatSequenceNo", () => {
	it("formats with default 4-digit padding", () => {
		expect(formatSequenceNo("INV", 2026, 42)).toBe("INV-2026-0042");
	});

	it("formats single digit with padding", () => {
		expect(formatSequenceNo("EXP", 2026, 7)).toBe("EXP-2026-0007");
	});

	it("formats value 1", () => {
		expect(formatSequenceNo("QT", 2026, 1)).toBe("QT-2026-0001");
	});

	it("handles multi-part prefix", () => {
		expect(formatSequenceNo("DOC-LET", 2026, 1)).toBe("DOC-LET-2026-0001");
	});

	it("handles custom padding width", () => {
		expect(formatSequenceNo("X", 2026, 1, 6)).toBe("X-2026-000001");
	});

	it("handles value exceeding pad width (no truncation)", () => {
		expect(formatSequenceNo("INV", 2026, 99999)).toBe("INV-2026-99999");
	});

	it("handles large value", () => {
		expect(formatSequenceNo("INV", 2026, 100000)).toBe("INV-2026-100000");
	});

	it("formats with different years", () => {
		expect(formatSequenceNo("INV", 2025, 1)).toBe("INV-2025-0001");
		expect(formatSequenceNo("INV", 2030, 500)).toBe("INV-2030-0500");
	});

	it("formats common prefixes", () => {
		expect(formatSequenceNo("INV", 2026, 1)).toBe("INV-2026-0001");
		expect(formatSequenceNo("EXP", 2026, 1)).toBe("EXP-2026-0001");
		expect(formatSequenceNo("QT", 2026, 1)).toBe("QT-2026-0001");
		expect(formatSequenceNo("RCV", 2026, 1)).toBe("RCV-2026-0001");
		expect(formatSequenceNo("TRF", 2026, 1)).toBe("TRF-2026-0001");
	});

	it("handles pad=0 (no padding)", () => {
		expect(formatSequenceNo("INV", 2026, 42, 0)).toBe("INV-2026-42");
	});

	it("handles pad=1", () => {
		expect(formatSequenceNo("INV", 2026, 5, 1)).toBe("INV-2026-5");
		expect(formatSequenceNo("INV", 2026, 42, 1)).toBe("INV-2026-42");
	});
});
