/**
 * File Upload Hardening Tests — Sprint 4.4 Verification
 * Tests validateAttachment, validateFileName, validateFileHeader
 */
import { describe, it, expect } from "vitest";
import {
	validateAttachment,
	validateFileName,
	validateFileHeader,
} from "../prisma/queries/attachments";

// ═════════════════════════════════════════════════════════════════════════════
// validateFileName — double extensions + dangerous types
// ═════════════════════════════════════════════════════════════════════════════

describe("validateFileName", () => {
	it("accepts normal file names", () => {
		expect(validateFileName("invoice.pdf").valid).toBe(true);
		expect(validateFileName("photo.jpg").valid).toBe(true);
		expect(validateFileName("report.xlsx").valid).toBe(true);
		expect(validateFileName("document.docx").valid).toBe(true);
	});

	it("rejects double extensions with dangerous final extension", () => {
		const r = validateFileName("invoice.pdf.exe");
		expect(r.valid).toBe(false);
		// Rejected via final-extension check (.exe is dangerous)
		expect(r.error).toBeDefined();
	});

	it("rejects double extensions with dangerous inner extension", () => {
		// .bat is dangerous as inner extension; .pdf is safe as final extension
		const r = validateFileName("payload.bat.pdf");
		expect(r.valid).toBe(false);
		expect(r.error).toContain("مزدوج");
	});

	it("rejects .exe extension", () => {
		const r = validateFileName("malware.exe");
		expect(r.valid).toBe(false);
	});

	it("rejects .svg extension", () => {
		const r = validateFileName("icon.svg");
		expect(r.valid).toBe(false);
	});

	it("rejects .html extension", () => {
		const r = validateFileName("page.html");
		expect(r.valid).toBe(false);
	});

	it("rejects .bat extension", () => {
		const r = validateFileName("script.bat");
		expect(r.valid).toBe(false);
	});

	it("rejects .js extension", () => {
		const r = validateFileName("payload.js");
		expect(r.valid).toBe(false);
	});

	it("accepts files with multiple dots in name (non-dangerous)", () => {
		expect(validateFileName("my.report.v2.pdf").valid).toBe(true);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// validateAttachment — SVG blocking + extension-MIME consistency
// ═════════════════════════════════════════════════════════════════════════════

describe("validateAttachment", () => {
	it("blocks SVG MIME type", () => {
		const r = validateAttachment("DOCUMENT", "image/svg+xml", 1000);
		expect(r.valid).toBe(false);
		expect(r.error).toContain("محظور");
	});

	it("blocks text/html MIME type", () => {
		const r = validateAttachment("DOCUMENT", "text/html", 1000);
		expect(r.valid).toBe(false);
	});

	it("blocks application/javascript MIME type", () => {
		const r = validateAttachment("DOCUMENT", "application/javascript", 1000);
		expect(r.valid).toBe(false);
	});

	it("allows valid PDF upload", () => {
		const r = validateAttachment("DOCUMENT", "application/pdf", 1000, "report.pdf");
		expect(r.valid).toBe(true);
	});

	it("allows valid JPEG upload", () => {
		const r = validateAttachment("PHOTO", "image/jpeg", 1000, "photo.jpg");
		expect(r.valid).toBe(true);
	});

	it("rejects extension-MIME mismatch: .jpg claiming PDF", () => {
		const r = validateAttachment("DOCUMENT", "application/pdf", 1000, "photo.jpg");
		expect(r.valid).toBe(false);
		expect(r.error).toContain("لا يتطابق");
	});

	it("rejects extension-MIME mismatch: .pdf claiming JPEG", () => {
		const r = validateAttachment("EXPENSE", "image/jpeg", 1000, "invoice.pdf");
		expect(r.valid).toBe(false);
		expect(r.error).toContain("لا يتطابق");
	});

	it("rejects file exceeding size limit", () => {
		const r = validateAttachment("EXPENSE", "application/pdf", 100 * 1024 * 1024);
		expect(r.valid).toBe(false);
		expect(r.error).toContain("ميجابايت");
	});

	it("works without optional fileName (backward compatible)", () => {
		const r = validateAttachment("DOCUMENT", "application/pdf", 1000);
		expect(r.valid).toBe(true);
	});
});

// ═════════════════════════════════════════════════════════════════════════════
// validateFileHeader — magic bytes
// ═════════════════════════════════════════════════════════════════════════════

describe("validateFileHeader", () => {
	it("validates PNG magic bytes", () => {
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		expect(validateFileHeader(png, "image/png").valid).toBe(true);
	});

	it("rejects PNG bytes when claiming JPEG", () => {
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const r = validateFileHeader(png, "image/jpeg");
		expect(r.valid).toBe(false);
		expect(r.detectedType).toBe("image/png");
	});

	it("validates JPEG magic bytes", () => {
		const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		expect(validateFileHeader(jpeg, "image/jpeg").valid).toBe(true);
	});

	it("validates PDF magic bytes", () => {
		const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e]);
		expect(validateFileHeader(pdf, "application/pdf").valid).toBe(true);
	});

	it("rejects PDF bytes when claiming image/png", () => {
		const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
		const r = validateFileHeader(pdf, "image/png");
		expect(r.valid).toBe(false);
		expect(r.detectedType).toBe("application/pdf");
	});

	it("allows unknown signatures (e.g. DOCX/XLSX = ZIP)", () => {
		const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
		const r = validateFileHeader(zip, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
		expect(r.valid).toBe(true);
	});

	it("rejects too-short header", () => {
		const short = new Uint8Array([0x89, 0x50]);
		const r = validateFileHeader(short, "image/png");
		expect(r.valid).toBe(false);
		expect(r.error).toContain("غير كافية");
	});

	it("validates WebP magic bytes (RIFF...WEBP)", () => {
		// RIFF....WEBP
		const webp = new Uint8Array([
			0x52, 0x49, 0x46, 0x46, // RIFF
			0x00, 0x00, 0x00, 0x00, // file size (placeholder)
			0x57, 0x45, 0x42, 0x50, // WEBP
		]);
		expect(validateFileHeader(webp, "image/webp").valid).toBe(true);
	});

	it("rejects RIFF/WEBP bytes when claiming JPEG", () => {
		const webp = new Uint8Array([
			0x52, 0x49, 0x46, 0x46,
			0x00, 0x00, 0x00, 0x00,
			0x57, 0x45, 0x42, 0x50,
		]);
		const r = validateFileHeader(webp, "image/jpeg");
		expect(r.valid).toBe(false);
		expect(r.detectedType).toBe("image/webp");
	});
});
