/**
 * READ-ONLY: Decode the QR TLV stored on a Masar invoice
 * to verify whether tag 8 (public key) contains valid DER bytes
 * or PEM-with-headers (a known suspected bug).
 *
 * Run: pnpm tsx scripts/zatca/decode-qr.ts [INVOICE_NO]
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
		`SELECT zatca_xml, zatca_cleared_xml, qr_code FROM finance_invoices WHERE invoice_no = $1`,
		[INVOICE_NO],
	);
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(1); }

	// QR is embedded inside the SIGNED/CLEARED XML, not the pre-signing XML.
	// Look at every <cbc:EmbeddedDocumentBinaryObject> and pick the one that
	// sits under a cbc:ID="QR" AdditionalDocumentReference.
	const cleared = r.rows[0].zatca_cleared_xml ?? r.rows[0].zatca_xml ?? "";
	console.log("cleared XML chars:", cleared.length);
	let qrBase64: string | null = null;

	// First try: explicit AdditionalDocumentReference with ID=QR
	const adrRegex = /<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/;
	const adrMatch = cleared.match(adrRegex);
	if (adrMatch) qrBase64 = adrMatch[1];

	// Show all EmbeddedDocumentBinaryObject occurrences for diagnosis
	const all = [...cleared.matchAll(/<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/g)];
	console.log("found", all.length, "EmbeddedDocumentBinaryObject(s)");
	for (let k = 0; k < all.length; k++) {
		console.log(`  [${k}] base64 length:`, all[k][1].length, "first 60:", all[k][1].substring(0, 60));
	}

	// Fallback: pick the longest EmbeddedDocumentBinaryObject (likely QR)
	if (!qrBase64 && all.length) {
		all.sort((a, b) => b[1].length - a[1].length);
		qrBase64 = all[0][1];
	}

	// Fallback: maybe qr_code column itself is the TLV
	if (!qrBase64 && r.rows[0].qr_code && !r.rows[0].qr_code.startsWith("data:")) {
		qrBase64 = r.rows[0].qr_code;
	}

	if (!qrBase64) {
		console.error("No QR TLV found in zatca_xml.");
		console.log("qr_code first 100 chars:", (r.rows[0].qr_code ?? "").substring(0, 100));
		await c.end();
		process.exit(1);
	}

	const tlv = Buffer.from(qrBase64, "base64");
	console.log("QR TLV total bytes:", tlv.length);
	console.log("QR base64 length  :", qrBase64.length);
	console.log();

	// Walk TLV
	let i = 0;
	while (i < tlv.length) {
		const tag = tlv[i++];
		let len = tlv[i++];
		if (len === 0x81) len = tlv[i++];
		else if (len === 0x82) { len = (tlv[i] << 8) | tlv[i + 1]; i += 2; }
		const val = tlv.subarray(i, i + len);
		i += len;

		const isText = tag <= 5;
		const preview = isText
			? val.toString("utf-8")
			: val.toString("hex").substring(0, 80) + (val.length > 40 ? "…" : "");

		console.log(`Tag ${tag}  len=${len}  ${isText ? "TEXT" : "BIN"}: ${preview}`);

		// Special: tag 8 must be DER SPKI (start with 30 ...)
		if (tag === 8) {
			const firstByte = val[0]?.toString(16).padStart(2, "0");
			const startsLikeDer = val[0] === 0x30; // ASN.1 SEQUENCE
			const looksPemHeader = val.toString("utf-8", 0, 20).includes("BEGIN") ||
				val.toString("utf-8", 0, 30).includes("KEY");
			console.log("    → tag 8 first byte:", firstByte, "(DER SPKI must start 30; got " + firstByte + ")");
			console.log("    → looks like PEM headers leaked in?", looksPemHeader);
			console.log("    → first 30 bytes utf8:", JSON.stringify(val.toString("utf-8", 0, 30)));
			console.log("    → DER-valid SPKI?", startsLikeDer ? "YES ✓" : "NO ✗ (this is the suspected bug)");
		}

		// Tag 7 = signature, expect ~70-72 bytes for ECDSA P-256/secp256k1 DER
		if (tag === 7) {
			console.log("    → signature length:", len, "bytes (expected ~70-72 for ECDSA DER)");
		}
	}

	await c.end();
})();
