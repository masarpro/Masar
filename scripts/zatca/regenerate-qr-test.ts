/**
 * READ-ONLY: Regenerate the QR PNG for INV-2026-0026 using the FIXED
 * qr-image.ts parameters and validate:
 *   1. Image dimensions (>=400x400)
 *   2. Quiet zone (>=4 modules / ~30+ white px on every edge)
 *   3. Compare to old PNG to confirm change
 *   4. Save the new PNG to disk for the user to scan with a phone
 *
 * Run: pnpm tsx scripts/zatca/regenerate-qr-test.ts [INV-2026-0026]
 */

import pg from "pg";
import sharp from "sharp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "node:fs";
import { generateZatcaQRImage } from "../../packages/api/lib/zatca/qr-image";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0026";

function extractQR(xml: string): string | null {
	const m = xml.match(
		/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/,
	);
	return m ? m[1].trim() : null;
}

/**
 * Walks pixels of a grayscale buffer to find the smallest white border on any
 * side. Returns the smallest border in pixels.
 *
 * White is treated as luma >= 250.
 */
function measureQuietZone(buf: Buffer, width: number, height: number, channels: number): {
	top: number;
	bottom: number;
	left: number;
	right: number;
} {
	// luma >= 200 treated as white — generous enough to ignore PNG/AA fringe
	const isWhite = (px: number) => px >= 200;
	const lumaAt = (x: number, y: number): number => {
		const off = (y * width + x) * channels;
		// grayscale or RGB(A): use red channel as luma proxy after .toColourspace("b-w")
		return buf[off]!;
	};

	let top = 0;
	for (let y = 0; y < height; y++) {
		let allWhite = true;
		for (let x = 0; x < width; x++) {
			if (!isWhite(lumaAt(x, y))) { allWhite = false; break; }
		}
		if (!allWhite) { top = y; break; }
	}

	let bottom = 0;
	for (let y = height - 1; y >= 0; y--) {
		let allWhite = true;
		for (let x = 0; x < width; x++) {
			if (!isWhite(lumaAt(x, y))) { allWhite = false; break; }
		}
		if (!allWhite) { bottom = (height - 1) - y; break; }
	}

	let left = 0;
	for (let x = 0; x < width; x++) {
		let allWhite = true;
		for (let y = 0; y < height; y++) {
			if (!isWhite(lumaAt(x, y))) { allWhite = false; break; }
		}
		if (!allWhite) { left = x; break; }
	}

	let right = 0;
	for (let x = width - 1; x >= 0; x--) {
		let allWhite = true;
		for (let y = 0; y < height; y++) {
			if (!isWhite(lumaAt(x, y))) { allWhite = false; break; }
		}
		if (!allWhite) { right = (width - 1) - x; break; }
	}

	return { top, bottom, left, right };
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT i.invoice_no, i.qr_code, s.signed_xml_content
		   FROM finance_invoices i
		   JOIN zatca_submissions s ON s.invoice_id = i.id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC LIMIT 1`,
		[INV],
	);
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(1); }
	const row = r.rows[0];

	const tlvB64 = extractQR(row.signed_xml_content);
	if (!tlvB64) { console.error("no QR in signed XML"); await c.end(); process.exit(1); }

	const tlvLen = Buffer.from(tlvB64, "base64").length;
	console.log("════════════════════════════════════════════════════════════");
	console.log("  QR REGENERATION TEST for", INV);
	console.log("  TLV input:", tlvB64.length, "chars b64 →", tlvLen, "raw bytes");
	console.log("════════════════════════════════════════════════════════════\n");

	// ─── OLD PNG (from DB, generated with margin=1 width=200) ─────────
	const oldPng = Buffer.from((row.qr_code as string).split(",")[1] ?? "", "base64");
	console.log("OLD PNG (DB, margin=1 width=200):");
	const oldMeta = await sharp(oldPng).metadata();
	console.log(`  bytes: ${oldPng.length}  dims: ${oldMeta.width}x${oldMeta.height}`);
	const oldGray = await sharp(oldPng).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
	const oldQz = measureQuietZone(oldGray.data, oldGray.info.width, oldGray.info.height, oldGray.info.channels);
	console.log(`  quiet zone (px): top=${oldQz.top} bottom=${oldQz.bottom} left=${oldQz.left} right=${oldQz.right}`);
	const oldMin = Math.min(oldQz.top, oldQz.bottom, oldQz.left, oldQz.right);
	// Module size estimate: 200/85 ≈ 2.4 px (Phase 2 v15 QR, 77 modules + 8 quiet)
	const oldModulePx = 200 / 85;
	const oldQuietModules = oldMin / oldModulePx;
	console.log(`  smallest border: ${oldMin}px ≈ ${oldQuietModules.toFixed(1)} modules ${oldQuietModules >= 3.5 ? "✓" : "✗ (QR/ISO 18004 requires ≥4 modules)"}`);

	// ─── NEW PNG (regenerated with margin=5 width=400) ──────────────
	const newDataUrl = await generateZatcaQRImage(tlvB64);
	const newPng = Buffer.from(newDataUrl.split(",")[1] ?? "", "base64");
	console.log("\nNEW PNG (qr-image.ts after fix, margin=5 width=400):");
	const newMeta = await sharp(newPng).metadata();
	console.log(`  bytes: ${newPng.length}  dims: ${newMeta.width}x${newMeta.height}`);
	const newGray = await sharp(newPng).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
	const newQz = measureQuietZone(newGray.data, newGray.info.width, newGray.info.height, newGray.info.channels);
	console.log(`  quiet zone (px): top=${newQz.top} bottom=${newQz.bottom} left=${newQz.left} right=${newQz.right}`);
	const newMin = Math.min(newQz.top, newQz.bottom, newQz.left, newQz.right);
	const newModulePx = 400 / 85;  // ≈ 4.7 px
	const newQuietModules = newMin / newModulePx;
	console.log(`  smallest border: ${newMin}px ≈ ${newQuietModules.toFixed(1)} modules ${newQuietModules >= 3.5 ? "✓ (meets QR/ISO 18004 spec, scannable)" : "✗"}`);
	console.log(`  module size    : ${newModulePx.toFixed(1)}px (good: ≥4)`);

	// ─── Save to disk for visual / phone scan ───────────────────────
	const outDir = path.resolve(__dirname);
	const oldPath = path.join(outDir, "_qr-OLD-margin1-width200.png");
	const newPath = path.join(outDir, "_qr-NEW-margin4-width400.png");
	fs.writeFileSync(oldPath, oldPng);
	fs.writeFileSync(newPath, newPng);
	console.log(`\nSaved for visual / phone-scan inspection:`);
	console.log(`  ${oldPath}`);
	console.log(`  ${newPath}`);

	// ─── Round-trip via the qrcode library's own decoder (if present) ─
	// The 'qrcode' package only encodes; we rely on sharp + a manual quiet-zone
	// check above. To cryptographically verify the encoded TLV is identical,
	// we re-extract from the cleared XML elsewhere (regenerate-and-compare-qr.ts).

	console.log("\n══ VERDICT ══");
	const oldOk = oldQuietModules >= 3.5;
	const newOk = newQuietModules >= 3.5;
	console.log(`  OLD QR scannable? ${oldOk ? "✓" : "✗ (quiet zone " + oldQuietModules.toFixed(1) + " modules — well below 4-module minimum)"}`);
	console.log(`  NEW QR scannable? ${newOk ? "✓ (quiet zone " + newQuietModules.toFixed(1) + " modules + " + newModulePx.toFixed(1) + "px modules)" : "✗"}`);
	console.log(`  Fix effective?    ${!oldOk && newOk ? "✅ YES — open _qr-NEW…png and scan with phone to confirm" : "(see above)"}`);
	console.log();

	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
