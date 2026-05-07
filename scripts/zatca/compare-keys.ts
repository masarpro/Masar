/**
 * READ-ONLY: Cross-reference 3 public keys for INV-2026-0023:
 *   (a) device.publicKey (stored at onboarding)
 *   (b) public key embedded inside device.csidCertificate (ZATCA-issued cert)
 *   (c) public key in QR tag 8 (what the ZATCA verifier app reads)
 *
 * Run: pnpm tsx scripts/zatca/compare-keys.ts [INV-2026-0023]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { X509Certificate, createPublicKey } from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0023";

function describeSpki(spki: Buffer): string {
	const hex = spki.toString("hex");
	if (hex.includes("06082a8648ce3d030107")) return "prime256v1 / P-256 (NIST)";
	if (hex.includes("06052b8104000a"))     return "secp256k1 (Bitcoin/ZATCA)";
	return "unknown curve";
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT d.public_key,
		        d.csid_certificate,
		        i.zatca_xml,
		        i.zatca_cleared_xml,
		        i.zatca_signature
		   FROM zatca_devices d
		   JOIN zatca_submissions s ON s.device_id = d.id
		   JOIN finance_invoices i ON i.id = s.invoice_id
		  WHERE i.invoice_no = $1
		  LIMIT 1`,
		[INV],
	);
	if (!r.rows.length) { console.error("not found"); await c.end(); process.exit(1); }
	const row = r.rows[0];

	console.log("════════════════════════════════════════════════════════════");
	console.log("  KEY-COMPARISON for", INV);
	console.log("════════════════════════════════════════════════════════════\n");

	// (a) device.public_key — strip PEM headers, then base64-decode body
	console.log("── (a) device.public_key (PEM stored at onboarding) ──");
	const pemBody = (row.public_key ?? "")
		.replace(/-----BEGIN [^-]+-----/g, "")
		.replace(/-----END [^-]+-----/g, "")
		.replace(/\s/g, "");
	const aSpki = Buffer.from(pemBody, "base64");
	console.log("  SPKI length:", aSpki.length, "bytes");
	console.log("  SPKI hex   :", aSpki.toString("hex"));
	console.log("  curve      :", describeSpki(aSpki));

	// (b) public key inside csid_certificate — use Node's X509
	console.log("\n── (b) public key embedded in csid_certificate ──");
	try {
		const certPemBody = Buffer.from(row.csid_certificate, "base64").toString("utf-8")
			.replace(/-----BEGIN CERTIFICATE-----/g, "")
			.replace(/-----END CERTIFICATE-----/g, "")
			.replace(/\s/g, "");
		const certPem = `-----BEGIN CERTIFICATE-----\n${certPemBody}\n-----END CERTIFICATE-----`;
		const cert = new X509Certificate(certPem);
		const certKey = cert.publicKey;
		const bSpki = certKey.export({ type: "spki", format: "der" }) as Buffer;
		console.log("  SPKI length:", bSpki.length, "bytes");
		console.log("  SPKI hex   :", bSpki.toString("hex"));
		console.log("  curve      :", describeSpki(bSpki));
	} catch (e) {
		console.log("  decode error:", (e as Error).message);
	}

	// (c) public key inside QR tag 8 — extract from zatca_cleared_xml or zatca_xml
	console.log("\n── (c) public key inside QR tag 8 ──");
	const xml = row.zatca_cleared_xml || row.zatca_xml || "";
	const all = [...xml.matchAll(/<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/g)];
	let qrB64 = "";
	for (const m of all) if (m[1].length > qrB64.length) qrB64 = m[1];
	const tlv = Buffer.from(qrB64, "base64");
	let off = 0;
	let tag8: Buffer | null = null;
	while (off < tlv.length) {
		const tag = tlv[off++];
		let len = tlv[off++];
		if (len === 0x81) len = tlv[off++];
		else if (len === 0x82) { len = (tlv[off] << 8) | tlv[off+1]; off += 2; }
		const v = tlv.subarray(off, off + len);
		off += len;
		if (tag === 8) tag8 = v;
	}
	if (tag8) {
		console.log("  SPKI length:", tag8.length, "bytes");
		console.log("  SPKI hex   :", tag8.toString("hex"));
		console.log("  curve      :", describeSpki(tag8));
	} else {
		console.log("  tag 8 not found in QR");
	}

	// (d) signature in DB
	console.log("\n── (d) zatca_signature decoded ──");
	const sigBytes = Buffer.from(row.zatca_signature, "base64");
	console.log("  bytes:", sigBytes.length);
	console.log("  hex  :", sigBytes.toString("hex").substring(0, 80) + "…");
	console.log("  starts 0x30 (DER)?", sigBytes[0] === 0x30 ? "✓" : "✗");

	console.log("\n════════════════════════════════════════════════════════════");
	console.log("  VERDICT");
	console.log("════════════════════════════════════════════════════════════");
	console.log("  Device-stored public key curve : (see a)");
	console.log("  Certificate public key curve   : (see b)");
	console.log("  QR tag 8 public key curve      : (see c)");
	console.log("  ⚠️  If (a) ≠ (b), the stored key is stale — onboarding stored a different key than ZATCA signed.");
	console.log("  ⚠️  If (b) ≠ (c), the QR contains the WRONG key — verifier will fail signature check.");

	await c.end();
})();
