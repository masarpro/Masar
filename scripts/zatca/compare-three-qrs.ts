/**
 * READ-ONLY: Compare three QRs for a given invoice:
 *   (a) zatca_qr_code in DB column (this is what the PDF renders)
 *   (b) Masar's QR embedded in signed_xml_content (sent to ZATCA)
 *   (c) ZATCA's QR embedded in zatca_cleared_xml (returned by ZATCA)
 *
 * Goal: confirm whether the user is seeing the FIXED TLV or the old buggy
 * one — and whether ZATCA modified the QR after clearance.
 *
 * Run: pnpm tsx scripts/zatca/compare-three-qrs.ts [INV-2026-0024]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0024";

const SEP = "═".repeat(72);
const SUB = "─".repeat(72);

function extractQrFromXml(xml: string): string | null {
	if (!xml) return null;
	const m = xml.match(
		/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/,
	);
	return m ? m[1].trim() : null;
}

function parseTLV(b64: string): Array<{ tag: number; length: number; value: Buffer }> {
	const buf = Buffer.from(b64, "base64");
	const tags: Array<{ tag: number; length: number; value: Buffer }> = [];
	let i = 0;
	while (i < buf.length) {
		const tag = buf[i++]!;
		let len = buf[i++]!;
		if (len === 0x81) len = buf[i++]!;
		else if (len === 0x82) { len = (buf[i]! << 8) | buf[i + 1]!; i += 2; }
		const v = buf.subarray(i, i + len);
		i += len;
		tags.push({ tag, length: len, value: v });
	}
	return tags;
}

function describeTags(tags: Array<{ tag: number; length: number; value: Buffer }>) {
	for (const t of tags) {
		const hex = t.value.subarray(0, Math.min(20, t.value.length)).toString("hex");
		const ascii = t.value.toString("utf-8").replace(/[^\x20-\x7e]/g, ".").substring(0, 30);
		console.log(`  Tag ${t.tag.toString().padStart(2)}  len=${t.length.toString().padStart(4)}  hex=${hex}${t.value.length > 20 ? "…" : ""}`);
		if (t.tag <= 5) console.log(`         text="${ascii}${t.value.length > 30 ? "…" : ""}"`);
	}
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT i.id,
		        i.invoice_no,
		        i.qr_code,
		        i.zatca_uuid,
		        i.zatca_submission_status,
		        i.zatca_submitted_at,
		        i.created_at,
		        s.signed_xml_content,
		        s.cleared_xml AS sub_cleared_xml,
		        i.zatca_cleared_xml
		   FROM finance_invoices i
		   LEFT JOIN zatca_submissions s ON s.invoice_id = i.id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC NULLS LAST
		  LIMIT 1`,
		[INV],
	);
	if (!r.rows.length) { console.error("invoice not found:", INV); await c.end(); process.exit(1); }
	const row = r.rows[0];

	console.log(SEP);
	console.log("  COMPARE-THREE-QRS for", INV);
	console.log("  zatca_uuid       :", row.zatca_uuid);
	console.log("  status           :", row.zatca_submission_status);
	console.log("  submitted_at     :", row.zatca_submitted_at);
	console.log("  invoice created  :", row.created_at);
	console.log(SEP);

	// ─── (a) DB qr_code column (what the PDF renders) ─────────────────
	console.log("\n[a] DB qr_code column (PDF source)");
	console.log(SUB);
	const dbQr: string = row.qr_code ?? "";
	if (dbQr.startsWith("data:image")) {
		console.log("  format     : PNG data URL");
		console.log("  total len  :", dbQr.length, "chars");
		console.log("  ⚠️  TLV is encoded into the PNG pixels — cannot decode without QR scanner");
		console.log("  PNG header (first 64 chars):", dbQr.substring(0, 64));
	} else if (dbQr) {
		console.log("  format     : raw TLV base64");
		console.log("  base64 len :", dbQr.length);
		const tlv = Buffer.from(dbQr, "base64");
		console.log("  TLV bytes  :", tlv.length);
		describeTags(parseTLV(dbQr));
	} else {
		console.log("  (null)");
	}

	// ─── (b) Masar's QR inside signed_xml_content ─────────────────────
	console.log("\n[b] Masar's pre-ZATCA QR (signed_xml_content)");
	console.log(SUB);
	const sentQr = extractQrFromXml(row.signed_xml_content ?? "");
	if (sentQr) {
		console.log("  base64 len :", sentQr.length);
		const tlv = Buffer.from(sentQr, "base64");
		console.log("  TLV bytes  :", tlv.length);
		const tags = parseTLV(sentQr);
		console.log("  tag count  :", tags.length);
		describeTags(tags);
	} else {
		console.log("  (no QR found in signed_xml_content)");
	}

	// ─── (c) ZATCA's QR inside cleared XML ───────────────────────────
	console.log("\n[c] ZATCA-cleared QR (zatca_cleared_xml)");
	console.log(SUB);
	const clearedQr = extractQrFromXml(row.zatca_cleared_xml ?? row.sub_cleared_xml ?? "");
	if (clearedQr) {
		console.log("  base64 len :", clearedQr.length);
		const tlv = Buffer.from(clearedQr, "base64");
		console.log("  TLV bytes  :", tlv.length);
		const tags = parseTLV(clearedQr);
		console.log("  tag count  :", tags.length);
		describeTags(tags);
	} else {
		console.log("  (no QR found in cleared XML)");
	}

	// ─── DIFF ────────────────────────────────────────────────────────
	console.log("\n══ DIFFS ══");
	console.log("  (b) === (c) ?", sentQr === clearedQr ? "✓ YES (ZATCA returned the same QR)" : "✗ NO (ZATCA modified the QR)");

	// What is rendered in the PDF? Compare PNG hash to a fresh PNG from (b)
	if (dbQr?.startsWith("data:image") && sentQr) {
		// This won't tell us TLV equality directly, but we can check whether
		// the DB PNG's base64 starts the same as a fresh PNG from sentQr
		// (skipped — needs QR scanner; we just note the source).
		console.log("  PDF source : Masar's TLV (b) — qrCode column was rendered from signed.qrCode");
	}

	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
