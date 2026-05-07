/**
 * READ-ONLY: Verify the QR stored on a cleared invoice matches what ZATCA's
 * official reader app expects, per zatca-xml-js reference implementation.
 *
 * The reader does:
 *   1. Read TLV
 *   2. Tag 6  = base64 STRING of hash (UTF-8 bytes, ~44 chars)
 *   3. Tag 7  = base64 STRING of signature (UTF-8 bytes, ~96 chars)
 *   4. Tag 8  = raw DER SubjectPublicKeyInfo (binary)
 *   5. Tag 9  = raw DER cert signature (binary)
 *   6. ECDSA-verify(b64decode(tag7), b64decode(tag6), tag8) == true
 *      i.e. signature must verify against RAW hash bytes, NOT SignedInfo XML.
 *
 * Run: pnpm tsx scripts/zatca/verify-qr-against-zatca-spec.ts [INV-2026-0024]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { createPublicKey, createVerify } from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || null;

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = INV
		? await c.query(
			`SELECT i.invoice_no, i.zatca_uuid, s.signed_xml_content
			   FROM finance_invoices i
			   JOIN zatca_submissions s ON s.invoice_id = i.id
			  WHERE i.invoice_no = $1
			  ORDER BY s.created_at DESC LIMIT 1`,
			[INV],
		)
		: await c.query(
			`SELECT i.invoice_no, i.zatca_uuid, s.signed_xml_content
			   FROM finance_invoices i
			   JOIN zatca_submissions s ON s.invoice_id = i.id
			  WHERE i.zatca_submission_status = 'CLEARED'
			    AND s.signed_xml_content IS NOT NULL
			  ORDER BY i.zatca_cleared_at DESC LIMIT 1`,
		);
	if (!r.rows.length) { console.error("no cleared invoice with signed XML"); await c.end(); process.exit(2); }
	const row = r.rows[0];

	console.log("════════════════════════════════════════════════════════════");
	console.log("  ZATCA-SPEC QR VERIFIER");
	console.log("  invoice_no :", row.invoice_no);
	console.log("  uuid       :", row.zatca_uuid);
	console.log("════════════════════════════════════════════════════════════\n");

	// Extract QR from the signed XML (this is what gets PNG-encoded into qr_code)
	const m = (row.signed_xml_content as string).match(
		/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/,
	);
	if (!m) { console.error("no QR in signed_xml_content"); await c.end(); process.exit(3); }
	const qrB64 = m[1];
	const qrBuf = Buffer.from(qrB64, "base64");
	console.log(`QR base64 chars: ${qrB64.length} | TLV bytes: ${qrBuf.length}\n`);

	// Walk TLV
	type Tlv = { tag: number; len: number; value: Buffer };
	function walk(buf: Buffer): Tlv[] {
		const out: Tlv[] = [];
		let i = 0;
		while (i < buf.length) {
			const tag = buf[i++]!;
			let len = buf[i++]!;
			if (len === 0x81) len = buf[i++]!;
			else if (len === 0x82) { len = (buf[i]! << 8) | buf[i + 1]!; i += 2; }
			out.push({ tag, len, value: buf.subarray(i, i + len) });
			i += len;
		}
		return out;
	}
	const tags = walk(qrBuf);
	console.log("Total tags:", tags.length, tags.length === 9 ? "✓" : "✗ (spec requires 9)\n");

	let allValid = true;
	const tag = (n: number) => tags.find((t) => t.tag === n);

	console.log("══ Tag-by-tag spec validation ══\n");

	// Tag 6 — base64 STRING of hash (UTF-8 bytes)
	const t6 = tag(6);
	if (t6) {
		const ascii = t6.value.toString("ascii");
		const isAsciiB64 = /^[A-Za-z0-9+/=]+$/.test(ascii);
		const lengthOk = t6.len >= 40 && t6.len <= 50;
		console.log(`Tag 6 (hash):    ${t6.len} bytes`);
		console.log(`  content head : ${JSON.stringify(ascii.substring(0, 50))}${ascii.length > 50 ? "…" : ""}`);
		console.log(`  ASCII base64?: ${isAsciiB64 ? "✓" : "✗"}`);
		console.log(`  length 40-50?: ${lengthOk ? "✓" : "✗"}`);
		if (!isAsciiB64 || !lengthOk) { console.log("  🚨 INVALID per ZATCA spec"); allValid = false; }
	}

	// Tag 7 — base64 STRING of signature (UTF-8 bytes)
	const t7 = tag(7);
	if (t7) {
		const ascii = t7.value.toString("ascii");
		const isAsciiB64 = /^[A-Za-z0-9+/=]+$/.test(ascii);
		const lengthOk = t7.len >= 80 && t7.len <= 110;
		console.log(`\nTag 7 (signature): ${t7.len} bytes`);
		console.log(`  content head : ${JSON.stringify(ascii.substring(0, 60))}${ascii.length > 60 ? "…" : ""}`);
		console.log(`  ASCII base64?: ${isAsciiB64 ? "✓" : "✗"}`);
		console.log(`  length 80-110?: ${lengthOk ? "✓" : "✗"}`);
		if (!isAsciiB64 || !lengthOk) { console.log("  🚨 INVALID per ZATCA spec"); allValid = false; }
	}

	// Tag 8 — raw DER SPKI
	const t8 = tag(8);
	if (t8) {
		const startsCorrect = t8.value[0] === 0x30 && (t8.value[1] === 0x56 || t8.value[1] === 0x59);
		const lengthOk = t8.len >= 88 && t8.len <= 95;
		console.log(`\nTag 8 (publicKey): ${t8.len} bytes`);
		console.log(`  hex head     : ${t8.value.subarray(0, 20).toString("hex")}`);
		console.log(`  DER SEQUENCE?: ${startsCorrect ? "✓" : "✗"}`);
		console.log(`  length 88-95?: ${lengthOk ? "✓" : "✗"}`);
		if (!startsCorrect || !lengthOk) { console.log("  🚨 INVALID per ZATCA spec"); allValid = false; }
	}

	// Tag 9 — raw DER ECDSA cert signature
	const t9 = tag(9);
	if (t9) {
		const startsCorrect = t9.value[0] === 0x30;
		const lengthOk = t9.len >= 68 && t9.len <= 75;
		console.log(`\nTag 9 (certSig): ${t9.len} bytes`);
		console.log(`  hex head     : ${t9.value.subarray(0, 20).toString("hex")}`);
		console.log(`  DER SEQUENCE?: ${startsCorrect ? "✓" : "✗"}`);
		console.log(`  length 68-75?: ${lengthOk ? "✓" : "✗"}`);
		if (!startsCorrect || !lengthOk) { console.log("  🚨 INVALID per ZATCA spec"); allValid = false; }
	} else {
		console.log("\nTag 9 (certSig): MISSING ✗");
		allValid = false;
	}

	// CRITICAL ECDSA verify (what the ZATCA app actually does)
	console.log(`\n══ ECDSA-verify(b64decode(tag7), b64decode(tag6), tag8) ══\n`);
	if (t6 && t7 && t8) {
		try {
			// Per spec: tag 6 holds the base64 STRING of the hash. b64-decode → 32 raw bytes.
			let hashBytes: Buffer;
			let sigDer: Buffer;
			const t6Ascii = t6.value.toString("ascii");
			const t7Ascii = t7.value.toString("ascii");
			if (/^[A-Za-z0-9+/=]+$/.test(t6Ascii)) {
				hashBytes = Buffer.from(t6Ascii, "base64");
			} else {
				// fallback: assume the value is already raw bytes (Masar's old buggy form)
				hashBytes = t6.value;
			}
			if (/^[A-Za-z0-9+/=]+$/.test(t7Ascii)) {
				sigDer = Buffer.from(t7Ascii, "base64");
			} else {
				sigDer = t7.value;
			}
			console.log(`  decoded hash bytes : ${hashBytes.length}`);
			console.log(`  decoded sig DER    : ${sigDer.length}`);

			const pubKey = createPublicKey({
				key: t8.value,
				format: "der",
				type: "spki",
			});

			// What ZATCA app does: verify signature OVER raw hash bytes
			const verifier = createVerify("SHA256");
			verifier.update(hashBytes);
			const ok = verifier.verify({ key: pubKey, dsaEncoding: "der" }, sigDer);

			console.log(`\n  Result: ${ok ? "✅ VALID — ZATCA app can verify this QR" : "❌ INVALID — ZATCA app rejects this QR"}`);
			if (!ok) {
				console.log("\n  🚨 This is exactly why the ZATCA verifier app fails.");
				allValid = false;
			}
		} catch (e) {
			console.log("  verify error:", (e as Error).message);
			allValid = false;
		}
	}

	console.log(`\n══════════════════════════════`);
	console.log(`Overall: ${allValid ? "✅ ZATCA-spec VALID" : "❌ ZATCA-spec INVALID"}`);
	console.log("══════════════════════════════\n");
	await c.end();
	process.exit(allValid ? 0 : 1);
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
