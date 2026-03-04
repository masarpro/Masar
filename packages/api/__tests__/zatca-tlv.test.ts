/**
 * ZATCA TLV Encoding Tests
 *
 * Pure-function tests for TLV encoding/decoding and QR code generation.
 * No database or external services required.
 */
import { describe, it, expect } from "vitest";
import {
	encodeZatcaTLV,
	decodeZatcaTLV,
	type ZatcaTLVData,
} from "../lib/zatca/tlv-encoder";
import { generateZatcaQR, validateZatcaQR } from "../lib/zatca/qr-generator";

// ═══════════════════════════════════════════════════════════════════════════
// TLV Encoding / Decoding
// ═══════════════════════════════════════════════════════════════════════════

describe("encodeZatcaTLV / decodeZatcaTLV", () => {
	const sampleData: ZatcaTLVData = {
		sellerName: "Masar Construction",
		vatNumber: "310122393500003",
		timestamp: "2026-03-04T10:30:00Z",
		totalWithVat: "1150.00",
		vatAmount: "150.00",
	};

	it("roundtrip encode/decode preserves all 5 fields", () => {
		const encoded = encodeZatcaTLV(sampleData);
		const decoded = decodeZatcaTLV(encoded);

		expect(decoded.sellerName).toBe(sampleData.sellerName);
		expect(decoded.vatNumber).toBe(sampleData.vatNumber);
		expect(decoded.timestamp).toBe(sampleData.timestamp);
		expect(decoded.totalWithVat).toBe(sampleData.totalWithVat);
		expect(decoded.vatAmount).toBe(sampleData.vatAmount);
	});

	it("encodes correct TLV tag bytes", () => {
		const encoded = encodeZatcaTLV(sampleData);

		// First field: tag=1
		expect(encoded[0]).toBe(1);
		// Length of "Masar Construction" in UTF-8
		expect(encoded[1]).toBe(new TextEncoder().encode(sampleData.sellerName).length);
	});

	it("handles Arabic seller name (UTF-8)", () => {
		const arabicData: ZatcaTLVData = {
			sellerName: "شركة مسار للمقاولات",
			vatNumber: "310122393500003",
			timestamp: "2026-03-04T10:30:00Z",
			totalWithVat: "1150.00",
			vatAmount: "150.00",
		};

		const encoded = encodeZatcaTLV(arabicData);
		const decoded = decodeZatcaTLV(encoded);

		expect(decoded.sellerName).toBe("شركة مسار للمقاولات");
	});

	it("encodes all 5 ZATCA tags", () => {
		const encoded = encodeZatcaTLV(sampleData);
		const decoded = decodeZatcaTLV(encoded);

		// All 5 fields must be present
		expect(decoded.sellerName).toBeDefined();
		expect(decoded.vatNumber).toBeDefined();
		expect(decoded.timestamp).toBeDefined();
		expect(decoded.totalWithVat).toBeDefined();
		expect(decoded.vatAmount).toBeDefined();
	});

	it("handles large amounts", () => {
		const largeData: ZatcaTLVData = {
			sellerName: "Test Company",
			vatNumber: "300000000000003",
			timestamp: "2026-01-01T00:00:00Z",
			totalWithVat: "57500000.00",
			vatAmount: "7500000.00",
		};

		const encoded = encodeZatcaTLV(largeData);
		const decoded = decodeZatcaTLV(encoded);

		expect(decoded.totalWithVat).toBe("57500000.00");
		expect(decoded.vatAmount).toBe("7500000.00");
	});

	it("handles zero amounts", () => {
		const zeroData: ZatcaTLVData = {
			sellerName: "Test",
			vatNumber: "300000000000003",
			timestamp: "2026-01-01T00:00:00Z",
			totalWithVat: "0.00",
			vatAmount: "0.00",
		};

		const encoded = encodeZatcaTLV(zeroData);
		const decoded = decodeZatcaTLV(encoded);

		expect(decoded.totalWithVat).toBe("0.00");
		expect(decoded.vatAmount).toBe("0.00");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// QR Code Generation
// ═══════════════════════════════════════════════════════════════════════════

describe("generateZatcaQR", () => {
	it("generates a Base64 string", () => {
		const qr = generateZatcaQR({
			sellerName: "شركة مسار للمقاولات",
			vatNumber: "310122393500003",
			timestamp: new Date("2026-03-04T10:30:00Z"),
			totalWithVat: 1150.0,
			vatAmount: 150.0,
		});

		// Should be a valid Base64 string
		expect(typeof qr).toBe("string");
		expect(qr.length).toBeGreaterThan(0);
		// Base64 chars only
		expect(/^[A-Za-z0-9+/=]+$/.test(qr)).toBe(true);
	});

	it("throws on invalid VAT number (not 15 digits)", () => {
		expect(() =>
			generateZatcaQR({
				sellerName: "Test",
				vatNumber: "123",
				timestamp: new Date(),
				totalWithVat: 100,
				vatAmount: 15,
			}),
		).toThrow("VAT number must be exactly 15 digits");
	});

	it("throws on non-numeric VAT number", () => {
		expect(() =>
			generateZatcaQR({
				sellerName: "Test",
				vatNumber: "31012239350000X",
				timestamp: new Date(),
				totalWithVat: 100,
				vatAmount: 15,
			}),
		).toThrow("VAT number must be exactly 15 digits");
	});

	it("formats amounts to 2 decimal places", () => {
		const qr = generateZatcaQR({
			sellerName: "Test",
			vatNumber: "310122393500003",
			timestamp: new Date("2026-01-01T00:00:00Z"),
			totalWithVat: 1150,
			vatAmount: 150,
		});

		const decoded = validateZatcaQR(qr);
		expect(decoded.totalWithVat).toBe("1150.00");
		expect(decoded.vatAmount).toBe("150.00");
	});

	it("strips milliseconds from timestamp", () => {
		const qr = generateZatcaQR({
			sellerName: "Test",
			vatNumber: "310122393500003",
			timestamp: new Date("2026-03-04T10:30:00.123Z"),
			totalWithVat: 100,
			vatAmount: 15,
		});

		const decoded = validateZatcaQR(qr);
		expect(decoded.timestamp).toBe("2026-03-04T10:30:00Z");
		expect(decoded.timestamp).not.toContain(".123");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// QR Validation (roundtrip)
// ═══════════════════════════════════════════════════════════════════════════

describe("validateZatcaQR", () => {
	it("validates a correctly generated QR", () => {
		const qr = generateZatcaQR({
			sellerName: "شركة مسار للمقاولات",
			vatNumber: "310122393500003",
			timestamp: new Date("2026-03-04T10:30:00Z"),
			totalWithVat: 1150.0,
			vatAmount: 150.0,
		});

		const data = validateZatcaQR(qr);

		expect(data.sellerName).toBe("شركة مسار للمقاولات");
		expect(data.vatNumber).toBe("310122393500003");
		expect(data.timestamp).toBe("2026-03-04T10:30:00Z");
		expect(data.totalWithVat).toBe("1150.00");
		expect(data.vatAmount).toBe("150.00");
	});

	it("roundtrips with fractional amounts", () => {
		const qr = generateZatcaQR({
			sellerName: "Test Co",
			vatNumber: "300000000000003",
			timestamp: new Date("2026-06-15T14:00:00Z"),
			totalWithVat: 999.99,
			vatAmount: 130.43,
		});

		const data = validateZatcaQR(qr);
		expect(data.totalWithVat).toBe("999.99");
		expect(data.vatAmount).toBe("130.43");
	});
});
