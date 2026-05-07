/**
 * READ-ONLY: For each invoice, regenerate the QR PNG locally from the TLV
 * embedded in signed_xml_content and compare byte-for-byte against the
 * qr_code PNG stored in the DB.
 *
 *   PNG_match  →  the PDF is showing the correct (fixed) TLV
 *   PNG_diff   →  the PDF is rendering a different TLV than what's in the
 *                 signed XML (would indicate a runtime mismatch)
 *
 * This approach lets us verify PNG content without installing a QR decoder.
 *
 * Run: pnpm tsx scripts/zatca/regenerate-and-compare-qr.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { generateZatcaQRImage } from "../../packages/api/lib/zatca/qr-image";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const TARGETS = ["INV-2026-0016", "INV-2026-0024", "INV-2026-0025", "INV-2026-0026"];

function extractQrFromXml(xml: string): string | null {
	if (!xml) return null;
	const m = xml.match(
		/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/,
	);
	return m ? m[1].trim() : null;
}

function walkTLV(buf: Buffer): Array<{ tag: number; len: number }> {
	const out: Array<{ tag: number; len: number }> = [];
	let i = 0;
	while (i < buf.length) {
		const tag = buf[i++]!;
		let len = buf[i++]!;
		if (len === 0x81) len = buf[i++]!;
		else if (len === 0x82) { len = (buf[i]! << 8) | buf[i + 1]!; i += 2; }
		out.push({ tag, len });
		i += len;
	}
	return out;
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	for (const inv of TARGETS) {
		const r = await c.query(
			`SELECT i.invoice_no, i.qr_code, s.signed_xml_content
			   FROM finance_invoices i
			   LEFT JOIN zatca_submissions s ON s.invoice_id = i.id
			  WHERE i.invoice_no = $1
			  ORDER BY s.created_at DESC NULLS LAST LIMIT 1`,
			[inv],
		);
		if (!r.rows.length) continue;
		const row = r.rows[0];

		console.log("══════════════════════════════════════════════════════════");
		console.log("Invoice:", row.invoice_no);

		const dbQr: string = row.qr_code ?? "";
		if (!dbQr.startsWith("data:image")) {
			console.log("  qr_code is not a PNG data URL — skip");
			continue;
		}
		const dbPng = Buffer.from(dbQr.split(",")[1] ?? "", "base64");
		console.log(`  DB qr_code PNG: ${dbPng.length} bytes`);

		const tlvFromSignedXml = extractQrFromXml(row.signed_xml_content ?? "");
		if (!tlvFromSignedXml) {
			console.log("  no TLV in signed_xml_content (Phase 1 invoice) — cannot reproduce");
			console.log();
			continue;
		}
		const tlvBytes = Buffer.from(tlvFromSignedXml, "base64");
		const tags = walkTLV(tlvBytes);
		console.log(`  signed-XML TLV: ${tlvBytes.length} bytes, ${tags.length} tags (${tags.map((t) => t.tag).join(",")})`);

		// Reproduce the PNG using the EXACT same generator the runtime uses
		const reproDataUrl = await generateZatcaQRImage(tlvFromSignedXml);
		const reproPng = Buffer.from(reproDataUrl.split(",")[1] ?? "", "base64");
		console.log(`  Reproduced PNG: ${reproPng.length} bytes`);

		const equal = dbPng.equals(reproPng);
		console.log(`  byte-for-byte equal? ${equal ? "✓ YES (PDF shows the correct TLV)" : "✗ NO — PDF/runtime TLV differs from signed XML"}`);

		if (!equal) {
			// Find first differing byte
			const minLen = Math.min(dbPng.length, reproPng.length);
			let diffAt = -1;
			for (let k = 0; k < minLen; k++) if (dbPng[k] !== reproPng[k]) { diffAt = k; break; }
			console.log(`  size diff: db=${dbPng.length} vs repro=${reproPng.length}`);
			if (diffAt >= 0) {
				console.log(`  first byte diff at offset ${diffAt}`);
				console.log(`  db   :`, dbPng.subarray(Math.max(0, diffAt - 4), diffAt + 8).toString("hex"));
				console.log(`  repro:`, reproPng.subarray(Math.max(0, diffAt - 4), diffAt + 8).toString("hex"));
			}
		}
		console.log();
	}

	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
