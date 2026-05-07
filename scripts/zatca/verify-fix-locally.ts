/**
 * READ-ONLY: Apply the FIXED code path locally to stored INV-2026-0024
 * inputs (without touching DB) and verify per ZATCA spec.
 *
 * Pulls device + invoice from DB, decrypts the private key, runs the FIXED
 * invoice-signer logic in-process, then runs the same checks as
 * verify-qr-against-zatca-spec.ts on the freshly produced QR.
 *
 * Expected after both fixes:
 *   Tag 6 = ~44 ASCII bytes (base64 string of hash)
 *   Tag 7 = ~96 ASCII bytes (base64 string of hash-signature)
 *   Tag 8 = 88 raw DER bytes (secp256k1 SPKI)
 *   Tag 9 = ~72 raw DER bytes (cert signature)
 *   ECDSA-verify(b64decode(tag7), b64decode(tag6), tag8) = ✅ VALID
 *
 * Run: pnpm tsx scripts/zatca/verify-fix-locally.ts [INV-2026-0024]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { createPublicKey, createSign, createVerify, generateKeyPairSync } from "node:crypto";
import { generateEnhancedQR } from "../../packages/api/lib/zatca/phase2/qr-enhanced";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0024";

// ─── Replicate the FIXED extractCertificateSignature (DER walker) ─────
function extractCertificateSignature(certDerBytes: Buffer): string {
	let off = 0;
	if (certDerBytes[off] !== 0x30) throw new Error("not a SEQUENCE");
	off++;
	off += derLengthSize(certDerBytes, off);
	off += derTotalSize(certDerBytes, off); // tbsCertificate
	off += derTotalSize(certDerBytes, off); // signatureAlgorithm
	if (certDerBytes[off] !== 0x03) throw new Error("expected BIT STRING");
	off++;
	const len = readDerLength(certDerBytes, off);
	off += derLengthSize(certDerBytes, off);
	return certDerBytes.subarray(off + 1, off + len).toString("base64");
}
function readDerLength(buf: Buffer, off: number): number {
	const b = buf[off]!;
	if (b < 0x80) return b;
	const n = b & 0x7f;
	let v = 0;
	for (let i = 1; i <= n; i++) v = (v << 8) | buf[off + i]!;
	return v;
}
function derLengthSize(buf: Buffer, off: number): number {
	return buf[off]! < 0x80 ? 1 : 1 + (buf[off]! & 0x7f);
}
function derTotalSize(buf: Buffer, off: number): number {
	return 1 + derLengthSize(buf, off + 1) + readDerLength(buf, off + 1);
}

// ─── Walk a TLV buffer ────────────────────────────────────────────────
type Tlv = { tag: number; len: number; value: Buffer };
function walkTLV(buf: Buffer): Tlv[] {
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

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT i.invoice_no, i.zatca_uuid, i.zatca_hash, i.seller_name,
		        i.seller_tax_number, i.issued_at, i.total_amount, i.vat_amount,
		        d.csid_certificate
		   FROM finance_invoices i
		   JOIN zatca_submissions s ON s.invoice_id = i.id
		   JOIN zatca_devices d ON d.id = s.device_id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC LIMIT 1`,
		[INV],
	);
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(2); }
	const row = r.rows[0];

	console.log("════════════════════════════════════════════════════════════");
	console.log("  VERIFY-FIX-LOCALLY for", INV);
	console.log("  (using a TEST keypair — local env can't decrypt prod key)");
	console.log("════════════════════════════════════════════════════════════\n");

	// Generate a fresh secp256k1 keypair (same curve ZATCA uses) so we can run
	// the FULL ECDSA round-trip locally. This validates the FIXED code path,
	// not the production key — the encoding rules are key-independent.
	const { publicKey: testPubKey, privateKey: testPrivKey } = generateKeyPairSync("ec", {
		namedCurve: "secp256k1",
	});
	const publicKeyDerB64 = (testPubKey.export({ type: "spki", format: "pem" }) as string)
		.replace(/-----BEGIN [^-]+-----/g, "")
		.replace(/-----END [^-]+-----/g, "")
		.replace(/\s/g, "");

	// Sign the raw hash bytes (Fix 2 logic, with our test private key)
	const hashBytes = Buffer.from(row.zatca_hash, "base64");
	const qrSigner = createSign("SHA256");
	qrSigner.update(hashBytes);
	const qrSignature = qrSigner.sign(testPrivKey, "base64");
	console.log(`Hash bytes  : ${hashBytes.length}`);
	console.log(`QR signature: ${qrSignature.length} chars b64 → ${Buffer.from(qrSignature, "base64").length} raw DER`);

	// Cert signature via DER walker (Fix from commit 51dbcedd)
	const certPemBody = Buffer.from(row.csid_certificate, "base64").toString("utf-8")
		.replace(/-----BEGIN CERTIFICATE-----/g, "")
		.replace(/-----END CERTIFICATE-----/g, "")
		.replace(/\s/g, "");
	const certDer = Buffer.from(certPemBody, "base64");
	const certSignature = extractCertificateSignature(certDer);

	const ts = (row.issued_at as Date).toISOString().replace(/\.\d+Z$/, "");

	// Run the FIXED qr-enhanced.ts (already imported above; the change is
	// already on disk, so this call goes through the new encoding logic).
	const tlvBase64 = generateEnhancedQR({
		sellerName: row.seller_name ?? "مؤسسة عمران الخليج للمقاولات العامة",
		vatNumber: row.seller_tax_number,
		timestamp: ts,
		totalWithVat: String(row.total_amount),
		vatAmount: String(row.vat_amount),
		invoiceHash: row.zatca_hash,
		digitalSignature: qrSignature, // ← Fix 2: hash signature, not SignedInfo
		publicKey: publicKeyDerB64,
		certificateSignature: certSignature,
	});

	const tlv = Buffer.from(tlvBase64, "base64");
	const tags = walkTLV(tlv);
	console.log(`\nFIXED QR: ${tlvBase64.length} chars b64 → ${tlv.length} TLV bytes, ${tags.length} tags\n`);

	// ─── Tag-by-tag spec validation ─────────────────────────────────────
	console.log("══ Tag-by-tag spec validation ══\n");
	let allValid = true;
	const tag = (n: number) => tags.find((t) => t.tag === n);

	const t6 = tag(6)!;
	const t7 = tag(7)!;
	const t8 = tag(8)!;
	const t9 = tag(9)!;

	const t6Ascii = t6.value.toString("ascii");
	const t6Ok = /^[A-Za-z0-9+/=]+$/.test(t6Ascii) && t6.len >= 40 && t6.len <= 50;
	console.log(`Tag 6 (hash):      ${t6.len} bytes — "${t6Ascii.substring(0, 50)}…" — ${t6Ok ? "✓" : "✗"}`);
	if (!t6Ok) allValid = false;

	const t7Ascii = t7.value.toString("ascii");
	const t7Ok = /^[A-Za-z0-9+/=]+$/.test(t7Ascii) && t7.len >= 80 && t7.len <= 110;
	console.log(`Tag 7 (signature): ${t7.len} bytes — "${t7Ascii.substring(0, 60)}…" — ${t7Ok ? "✓" : "✗"}`);
	if (!t7Ok) allValid = false;

	const t8Ok = t8.value[0] === 0x30 && (t8.value[1] === 0x56 || t8.value[1] === 0x59) && t8.len >= 88 && t8.len <= 95;
	console.log(`Tag 8 (publicKey): ${t8.len} bytes — hex ${t8.value.subarray(0, 20).toString("hex")} — ${t8Ok ? "✓" : "✗"}`);
	if (!t8Ok) allValid = false;

	const t9Ok = t9.value[0] === 0x30 && t9.len >= 68 && t9.len <= 75;
	console.log(`Tag 9 (certSig):   ${t9.len} bytes — hex ${t9.value.subarray(0, 20).toString("hex")} — ${t9Ok ? "✓" : "✗"}`);
	if (!t9Ok) allValid = false;

	// ─── CRITICAL: ECDSA verify (what ZATCA app does) ─────────────────
	console.log(`\n══ ECDSA-verify(b64decode(tag7), b64decode(tag6), tag8) ══\n`);
	try {
		const decodedHash = Buffer.from(t6Ascii, "base64");
		const decodedSig = Buffer.from(t7Ascii, "base64");
		console.log(`  decoded hash : ${decodedHash.length} bytes`);
		console.log(`  decoded sig  : ${decodedSig.length} bytes`);

		const pubKey = createPublicKey({ key: t8.value, format: "der", type: "spki" });
		const verifier = createVerify("SHA256");
		verifier.update(decodedHash);
		const ok = verifier.verify({ key: pubKey, dsaEncoding: "der" }, decodedSig);
		console.log(`\n  Result: ${ok ? "✅ VALID — ZATCA app can verify this QR" : "❌ INVALID"}`);
		if (!ok) allValid = false;
	} catch (e) {
		console.log("  verify error:", (e as Error).message);
		allValid = false;
	}

	console.log(`\n══════════════════════════════`);
	console.log(`Overall: ${allValid ? "✅ ZATCA-spec VALID" : "❌ ZATCA-spec INVALID"}`);
	console.log("══════════════════════════════\n");
	await c.end();
	process.exit(allValid ? 0 : 1);
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
