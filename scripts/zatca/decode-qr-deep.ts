/**
 * READ-ONLY: Deep dive on QR TLV — confirms (a) whether tag 9 exists,
 * (b) whether tags 6-9 contain raw binary or ASCII-of-base64-string
 * (the suspected QR encoding bug).
 *
 * Run: pnpm tsx scripts/zatca/decode-qr-deep.ts [INVOICE_NO]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INVOICE_NO = process.argv[2] || "INV-2026-0020";

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT zatca_xml, zatca_cleared_xml, qr_code, zatca_hash, zatca_signature
		   FROM finance_invoices WHERE invoice_no = $1`,
		[INVOICE_NO],
	);
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(1); }
	const row = r.rows[0];

	console.log("════════════════════════════════════════════════════════════");
	console.log("  DEEP QR TLV DECODER");
	console.log("════════════════════════════════════════════════════════════\n");

	const cleared = row.zatca_cleared_xml || row.zatca_xml || "";
	const all = [...cleared.matchAll(/<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/g)];
	let qr = "";
	for (const m of all) if (m[1].length > qr.length) qr = m[1];
	console.log("outer QR base64 length:", qr.length);

	const tlv = Buffer.from(qr, "base64");
	console.log("decoded TLV bytes    :", tlv.length, "\n");

	let i = 0;
	let count = 0;
	while (i < tlv.length) {
		const tag = tlv[i++];
		let len = tlv[i++];
		if (len === 0x81) len = tlv[i++];
		else if (len === 0x82) { len = (tlv[i] << 8) | tlv[i + 1]; i += 2; }
		else if (len === 0x83) { len = (tlv[i] << 16) | (tlv[i+1] << 8) | tlv[i+2]; i += 3; }
		const val = tlv.subarray(i, i + len);
		i += len;
		count++;

		const isText = tag <= 5;
		console.log(`Tag ${tag.toString().padStart(2)}  len=${len.toString().padStart(4)}  ${isText ? "TEXT" : "BIN "}`);
		if (isText) {
			console.log(`           value : ${JSON.stringify(val.toString("utf-8"))}`);
		} else {
			const ascii = val.toString("utf-8").replace(/[^\x20-\x7e]/g, ".").substring(0, 64);
			const hex = val.toString("hex").substring(0, 64);
			console.log(`           hex   : ${hex}${val.length > 32 ? "…" : ""}`);
			console.log(`           ascii : "${ascii}${val.length > 32 ? "…" : ""}"`);
			// Heuristics
			const isPrintable = /^[A-Za-z0-9+/=]+$/.test(val.toString("utf-8"));
			if (isPrintable) {
				console.log(`           >>> looks like BASE64 STRING stored as ASCII bytes (not raw binary) — this is a Phase 2 QR bug`);
				console.log(`           >>> if decoded, would be ${Buffer.from(val.toString("utf-8"), "base64").length} raw bytes`);
			} else if (val[0] === 0x30) {
				console.log(`           >>> starts 0x30 — looks like DER (SEQUENCE) ✓`);
			}
		}
		console.log();
	}

	console.log(`TOTAL TAGS: ${count} (Phase 2 spec requires 9: 1=seller, 2=vat, 3=ts, 4=total, 5=vat, 6=hash, 7=sig, 8=pubkey, 9=certSig)`);
	if (count < 9) console.log("⚠️  Tag 9 (certificate signature) is MISSING — QR is incomplete per Phase 2 spec");

	// Cross-check: what does the DB-stored zatca_hash decode to?
	console.log("\n── Cross-check from DB columns ──");
	console.log("zatca_hash (B64)      :", row.zatca_hash);
	console.log("zatca_hash decoded len:", Buffer.from(row.zatca_hash, "base64").length, "(spec: 32)");
	console.log("zatca_signature (B64) :", (row.zatca_signature ?? "").substring(0, 60), "…");
	console.log("zatca_signature decoded len:", Buffer.from(row.zatca_signature ?? "", "base64").length, "(spec: ~70-72 ECDSA DER)");

	await c.end();
})();
