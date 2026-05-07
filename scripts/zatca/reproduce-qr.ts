/**
 * READ-ONLY: Run the current qr-enhanced.ts code with the SAME inputs that
 * INV-2026-0023 used (publicKey from DB, hash, signature, cert sig from DB).
 * Compare the resulting TLV against the actual QR stored on the invoice.
 *
 * Goal: prove whether the current code path produces:
 *   (i)  a 355-byte 8-tag TLV identical to the stored QR
 *   (ii) a different (longer) 9-tag TLV — which would mean Vercel runtime is older
 *
 * Run: pnpm tsx scripts/zatca/reproduce-qr.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { generateEnhancedQR } from "../../packages/api/lib/zatca/phase2/qr-enhanced";
import { createHash, X509Certificate } from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0023";

function extractCertificateSignature(certDerBytes: Buffer): string {
	const hex = certDerBytes.toString("hex");
	const halfPoint = Math.floor(hex.length / 2);
	let searchFrom = halfPoint;
	let lastIdx = -1;
	while (true) {
		const idx = hex.indexOf("03", searchFrom);
		if (idx === -1) break;
		lastIdx = idx;
		searchFrom = idx + 2;
	}
	if (lastIdx > 0) {
		const remaining = hex.substring(lastIdx);
		const lenByte = parseInt(remaining.substring(2, 4), 16);
		let sigStart = 4;
		let sigLength = lenByte;
		if (lenByte === 0x81) { sigLength = parseInt(remaining.substring(4, 6), 16); sigStart = 6; }
		else if (lenByte === 0x82) { sigLength = parseInt(remaining.substring(4, 8), 16); sigStart = 8; }
		const sigHex = remaining.substring(sigStart + 2, sigStart + 2 + (sigLength - 1) * 2);
		if (sigHex.length > 0) return Buffer.from(sigHex, "hex").toString("base64");
	}
	return createHash("sha256").update(certDerBytes).digest("base64");
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT d.public_key, d.csid_certificate, i.zatca_hash, i.zatca_signature,
		        i.zatca_xml, i.zatca_cleared_xml, i.zatca_uuid,
		        i.client_name, i.seller_name, i.seller_tax_number,
		        i.issued_at, i.total_amount, i.vat_amount
		   FROM zatca_devices d
		   JOIN zatca_submissions s ON s.device_id = d.id
		   JOIN finance_invoices i ON i.id = s.invoice_id
		  WHERE i.invoice_no = $1
		  LIMIT 1`,
		[INV],
	);
	const row = r.rows[0];

	// Compute certificate signature the same way invoice-signer does
	const pemBody = Buffer.from(row.csid_certificate, "base64").toString("utf-8")
		.replace(/-----BEGIN CERTIFICATE-----/g, "")
		.replace(/-----END CERTIFICATE-----/g, "")
		.replace(/\s/g, "");
	const certDer = Buffer.from(pemBody, "base64");
	const certSig = extractCertificateSignature(certDer);

	console.log("══ INPUTS ══");
	console.log("publicKey first 80 chars:", JSON.stringify((row.public_key ?? "").substring(0, 80)));
	console.log("invoiceHash             :", row.zatca_hash);
	console.log("signature first 60      :", (row.zatca_signature ?? "").substring(0, 60), "…");
	console.log("certSig first 60        :", certSig.substring(0, 60), "…");

	// Run the actual generator
	const ts = row.issued_at ? row.issued_at.toISOString().replace(".000Z", "") : "";
	const tlvBase64 = generateEnhancedQR({
		sellerName: row.seller_name ?? "مؤسسة عمران الخليج للمقاولات العامة",
		vatNumber: row.seller_tax_number,
		timestamp: ts,
		totalWithVat: String(row.total_amount),
		vatAmount: String(row.vat_amount),
		invoiceHash: row.zatca_hash,
		digitalSignature: row.zatca_signature,
		publicKey: row.public_key,
		certificateSignature: certSig,
	});

	const tlv = Buffer.from(tlvBase64, "base64");
	console.log("\n══ REPRODUCED QR ══");
	console.log("base64 length:", tlvBase64.length);
	console.log("TLV bytes    :", tlv.length);

	// Walk it
	let i = 0, count = 0;
	while (i < tlv.length) {
		const tag = tlv[i++];
		let len = tlv[i++];
		if (len === 0x81) len = tlv[i++];
		else if (len === 0x82) { len = (tlv[i] << 8) | tlv[i+1]; i += 2; }
		const v = tlv.subarray(i, i + len);
		i += len;
		count++;
		const head = v.subarray(0, Math.min(20, v.length)).toString("hex");
		console.log(`  Tag ${tag.toString().padStart(2)}  len=${len.toString().padStart(4)}  head=${head}${v.length > 20 ? "…" : ""}`);
	}
	console.log("Total tags reproduced:", count);

	// Compare with stored QR
	console.log("\n══ STORED QR (from cleared XML) ══");
	const xml = row.zatca_cleared_xml || row.zatca_xml || "";
	const all = [...xml.matchAll(/<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/g)];
	let storedB64 = "";
	for (const m of all) if (m[1].length > storedB64.length) storedB64 = m[1];
	const storedTlv = Buffer.from(storedB64, "base64");
	console.log("base64 length:", storedB64.length);
	console.log("TLV bytes    :", storedTlv.length);

	console.log("\n══ DIFF ══");
	console.log("reproduced bytes vs stored bytes:", tlv.length, "vs", storedTlv.length);
	console.log("byte-for-byte equal?", tlv.equals(storedTlv) ? "✓ YES" : "✗ NO");

	if (!tlv.equals(storedTlv)) {
		// Find first differing byte
		const min = Math.min(tlv.length, storedTlv.length);
		let firstDiff = -1;
		for (let k = 0; k < min; k++) if (tlv[k] !== storedTlv[k]) { firstDiff = k; break; }
		console.log("first differing byte index:", firstDiff);
		if (firstDiff >= 0) {
			console.log("  reproduced @ offset:", tlv.subarray(Math.max(0, firstDiff-4), firstDiff+8).toString("hex"));
			console.log("  stored     @ offset:", storedTlv.subarray(Math.max(0, firstDiff-4), firstDiff+8).toString("hex"));
		}
	}

	await c.end();
})();
