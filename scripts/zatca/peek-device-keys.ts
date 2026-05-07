/**
 * READ-ONLY: peek at the actual stored values for device.publicKey,
 * device.csidCertificate to understand why some QR tags decode correctly
 * while others don't.
 *
 * Run: pnpm tsx scripts/zatca/peek-device-keys.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	// Find the exact device that submitted INV-2026-0023
	const inv = process.argv[2] || "INV-2026-0023";
	const r = await c.query(
		`SELECT d.id, d.public_key,
		        d.invoice_counter,
		        LEFT(d.csid_certificate, 100) AS cert_head,
		        LENGTH(d.csid_certificate) AS cert_len,
		        LENGTH(d.private_key) AS priv_enc_len,
		        s.id AS sub_id, s.created_at
		   FROM zatca_devices d
		   JOIN zatca_submissions s ON s.device_id = d.id
		   JOIN finance_invoices i ON i.id = s.invoice_id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC LIMIT 1`,
		[inv],
	);
	if (!r.rows.length) { console.error("device for invoice not found:", inv); await c.end(); process.exit(1); }
	const row = r.rows[0];
	console.log("Device id:", row.id);
	console.log("Submission for", inv, "→", row.sub_id, row.created_at);
	console.log("Invoice counter on device:", row.invoice_counter);
	console.log("private_key encrypted length:", row.priv_enc_len);
	console.log("");

	console.log("══ device.public_key (raw, first 400 chars) ══");
	console.log(JSON.stringify((row.public_key ?? "").substring(0, 400)));
	console.log("\nlength:", row.public_key?.length);
	console.log("starts with '----': ", (row.public_key ?? "").startsWith("-----"));
	console.log("contains 'BEGIN':   ", (row.public_key ?? "").includes("BEGIN"));

	// Try base64-decoding in two ways to see what happens:
	const pubkeyAsIs = row.public_key ?? "";
	const decodeAsIs = Buffer.from(pubkeyAsIs, "base64");
	console.log("\nBuffer.from(public_key, 'base64') length:", decodeAsIs.length);
	console.log("first 20 hex:", decodeAsIs.subarray(0, 20).toString("hex"));

	// Alternative: strip PEM headers first
	const pemBody = pubkeyAsIs
		.replace(/-----BEGIN [^-]+-----/g, "")
		.replace(/-----END [^-]+-----/g, "")
		.replace(/\s/g, "");
	const decodeBody = Buffer.from(pemBody, "base64");
	console.log("\nAfter stripping PEM headers, decoded length:", decodeBody.length);
	console.log("first 20 hex:", decodeBody.subarray(0, 20).toString("hex"));

	console.log("\n══ csid_certificate first 100 chars ══");
	console.log(row.cert_head);

	await c.end();
})();
