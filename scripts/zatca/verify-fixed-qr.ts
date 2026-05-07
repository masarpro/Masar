/**
 * READ-ONLY: Reproduce QR generation with the FIXED invoice-signer.ts logic
 * using inputs from INV-2026-0023 (already in DB). Compare to ZATCA spec.
 *
 * What we verify:
 *  - Tag 8: ~88 bytes, valid DER SubjectPublicKeyInfo for secp256k1
 *           (head: 30 56 30 10 06 07 2a 86 48 ce 3d 02 01 06 05 2b 81 04 00 0a)
 *  - Tag 9: ~70-72 bytes, starts with 0x30 (DER ECDSA r,s SEQUENCE)
 *  - ECDSA-SHA256 signature verifiable: verify(tag7, raw-XML-bytes, tag8) == true
 *    (ZATCA verifies the DOCUMENT bytes, not the hash, with the public key.)
 *
 * Run: pnpm tsx scripts/zatca/verify-fixed-qr.ts [INV-2026-0023]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { createPublicKey, createVerify } from "node:crypto";
import { generateEnhancedQR } from "../../packages/api/lib/zatca/phase2/qr-enhanced";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0023";

const SEP = "═".repeat(72);

// ─── Replicate the FIXED extractCertificateSignature ──────────────────────
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

// ─── TLV walker ──────────────────────────────────────────────────────────
type Tlv = { tag: number; length: number; value: Buffer };
function walkTLV(buf: Buffer): Tlv[] {
	const out: Tlv[] = [];
	let i = 0;
	while (i < buf.length) {
		const tag = buf[i++]!;
		let len = buf[i++]!;
		if (len === 0x81) len = buf[i++]!;
		else if (len === 0x82) { len = (buf[i]! << 8) | buf[i + 1]!; i += 2; }
		const v = buf.subarray(i, i + len);
		i += len;
		out.push({ tag, length: len, value: v });
	}
	return out;
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT i.zatca_hash,
		        i.zatca_signature,
		        i.signed_xml_content_pre_clearance,
		        s.signed_xml_content,
		        d.public_key,
		        d.csid_certificate,
		        i.seller_name, i.seller_tax_number,
		        i.issued_at, i.total_amount, i.vat_amount
		   FROM finance_invoices i
		   JOIN zatca_submissions s ON s.invoice_id = i.id
		   JOIN zatca_devices d ON d.id = s.device_id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC LIMIT 1`,
		[INV],
	).catch(async () => {
		// fall back if column doesn't exist
		return c.query(
			`SELECT i.zatca_hash,
			        i.zatca_signature,
			        s.signed_xml_content,
			        d.public_key,
			        d.csid_certificate,
			        i.seller_name, i.seller_tax_number,
			        i.issued_at, i.total_amount, i.vat_amount
			   FROM finance_invoices i
			   JOIN zatca_submissions s ON s.invoice_id = i.id
			   JOIN zatca_devices d ON d.id = s.device_id
			  WHERE i.invoice_no = $1
			  ORDER BY s.created_at DESC LIMIT 1`,
			[INV],
		);
	});
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(1); }
	const row = r.rows[0];

	console.log(SEP);
	console.log("  VERIFY-FIXED-QR for", INV);
	console.log(SEP);

	// ─── Fix 1: PEM → base64-of-DER body ────────────────────────────────
	const publicKeyDerB64 = (row.public_key as string)
		.replace(/-----BEGIN [^-]+-----/g, "")
		.replace(/-----END [^-]+-----/g, "")
		.replace(/\s/g, "");
	console.log("\n[Fix 1] publicKey PEM → DER body (length):", publicKeyDerB64.length);

	// ─── Fix 2: proper DER walk for cert signature ──────────────────────
	const certPemBody = Buffer.from(row.csid_certificate, "base64").toString("utf-8")
		.replace(/-----BEGIN CERTIFICATE-----/g, "")
		.replace(/-----END CERTIFICATE-----/g, "")
		.replace(/\s/g, "");
	const certDer = Buffer.from(certPemBody, "base64");
	const certSignature = extractCertificateSignature(certDer);
	console.log("[Fix 2] cert signatureValue (b64 length):", certSignature.length, "→ raw bytes:", Buffer.from(certSignature, "base64").length);

	// Build timestamp the same way invoice-signer would (from issuedAt)
	const ts = (row.issued_at as Date).toISOString().replace(/\.\d+Z$/, "");

	// ─── Run the (unchanged) qr-enhanced.ts with FIXED inputs ────────────
	const tlvBase64 = generateEnhancedQR({
		sellerName: row.seller_name ?? "مؤسسة عمران الخليج للمقاولات العامة",
		vatNumber: row.seller_tax_number,
		timestamp: ts,
		totalWithVat: String(row.total_amount),
		vatAmount: String(row.vat_amount),
		invoiceHash: row.zatca_hash,
		digitalSignature: row.zatca_signature,
		publicKey: publicKeyDerB64,
		certificateSignature: certSignature,
	});
	const tlv = Buffer.from(tlvBase64, "base64");
	const tags = walkTLV(tlv);

	console.log("\n══ FIXED QR TLV ══");
	console.log("base64 length :", tlvBase64.length);
	console.log("TLV bytes     :", tlv.length);
	console.log("total tags    :", tags.length, tags.length === 9 ? "✓ (Phase 2 spec requires 9)" : "✗");

	for (const t of tags) {
		const head = t.value.subarray(0, Math.min(20, t.value.length)).toString("hex");
		console.log(`  Tag ${t.tag.toString().padStart(2)}  len=${t.length.toString().padStart(4)}  head=${head}${t.value.length > 20 ? "…" : ""}`);
	}

	// ─── Per-tag spec checks ────────────────────────────────────────────
	console.log("\n══ TAG VALIDATION ══");
	const tag6 = tags.find((x) => x.tag === 6)!;
	const tag7 = tags.find((x) => x.tag === 7)!;
	const tag8 = tags.find((x) => x.tag === 8)!;
	const tag9 = tags.find((x) => x.tag === 9);

	console.log("  Tag 6 (hash)      length:", tag6.length, tag6.length === 32 ? "✓ (32 raw SHA-256)" : "✗ should be 32");
	console.log("  Tag 7 (signature) length:", tag7.length, tag7.length >= 68 && tag7.length <= 73 && tag7.value[0] === 0x30 ? "✓ (DER ECDSA)" : "✗");
	const tag8Hex = tag8.value.subarray(0, 20).toString("hex");
	const isSecp256k1 = tag8Hex.startsWith("30") && tag8Hex.includes("06052b8104000a");
	const isP256 = tag8Hex.includes("06082a8648ce3d030107");
	console.log("  Tag 8 (publicKey) length:", tag8.length,
		isSecp256k1 ? "✓ (DER SPKI for secp256k1)" : isP256 ? "⚠ (DER SPKI for prime256v1)" : "✗");
	if (tag9) {
		console.log("  Tag 9 (certSig)   length:", tag9.length,
			tag9.length >= 68 && tag9.length <= 73 && tag9.value[0] === 0x30 ? "✓ (DER ECDSA)" : "✗");
	} else {
		console.log("  Tag 9             MISSING ✗");
	}

	// ─── Mathematical ECDSA verification ────────────────────────────────
	console.log("\n══ ECDSA SIGNATURE VERIFICATION ══");
	console.log("(verify Tag 7 signature using Tag 8 public key over the actual signed-info bytes)\n");

	// We can't easily reconstruct the signed SignedInfo here without re-running
	// invoice-signer. But we CAN do the second-best check: rebuild the public
	// key from tag 8 and confirm Node accepts it as a valid EC public key, and
	// that the signature parses as DER ECDSA.
	try {
		const pubKey = createPublicKey({
			key: Buffer.from(publicKeyDerB64, "base64"),
			format: "der",
			type: "spki",
		});
		console.log("  ✓ Tag 8 SPKI loaded as a valid EC public key");
		console.log("    asymmetricKeyType:", pubKey.asymmetricKeyType);
		const detail = (pubKey as any).asymmetricKeyDetails;
		console.log("    namedCurve       :", detail?.namedCurve ?? "(unknown)");
	} catch (e) {
		console.log("  ✗ Tag 8 cannot be loaded as a public key:", (e as Error).message);
	}

	// Verify by feeding the raw signed XML bytes into ECDSA-verify.
	// Note: the `zatca_signature` is over the SignedInfo XML, not the invoice
	// hash directly. Without rebuilding SignedInfo here we can't fully verify.
	// But we can at least round-trip the DB-stored signature through the key.
	try {
		const sigDer = Buffer.from(row.zatca_signature, "base64");
		// Sanity: parse as DER ECDSA SEQUENCE { r INTEGER, s INTEGER }
		if (sigDer[0] !== 0x30) throw new Error("signature not DER SEQUENCE");
		const lenSize = derLengthSize(sigDer, 1);
		const declaredLen = readDerLength(sigDer, 1);
		console.log(`  ✓ zatca_signature parses as DER SEQUENCE: declared ${declaredLen}, total ${1 + lenSize + declaredLen} bytes`);
	} catch (e) {
		console.log("  ✗ zatca_signature parse failed:", (e as Error).message);
	}

	// ─── End-to-end check using the pre-clearance Masar XML ────────────
	console.log("\n══ FULL ECDSA VERIFY (Masar's signed XML SignedInfo) ══");
	const signedXml = row.signed_xml_content as string;
	const signedInfoMatch = signedXml.match(/<ds:SignedInfo[\s\S]*?<\/ds:SignedInfo>/);
	if (!signedInfoMatch) {
		console.log("  (SignedInfo not present in signed_xml_content — skip)");
	} else {
		const signedInfo = signedInfoMatch[0];
		const verifier = createVerify("SHA256");
		verifier.update(signedInfo);
		try {
			const pubKey = createPublicKey({
				key: Buffer.from(publicKeyDerB64, "base64"),
				format: "der",
				type: "spki",
			});
			const ok = verifier.verify(
				{ key: pubKey, dsaEncoding: "der" },
				Buffer.from(row.zatca_signature, "base64"),
			);
			console.log(`  Result: ${ok ? "✅ VALID — Tag 8 public key correctly verifies the stored signature" : "❌ INVALID"}`);
		} catch (e) {
			console.log("  Verify error:", (e as Error).message);
		}
	}

	console.log("\n" + SEP);
	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
