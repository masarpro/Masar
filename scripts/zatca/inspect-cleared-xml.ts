/**
 * READ-ONLY: Decode every X509 cert that appears in the cleared XML
 * (Masar's signing cert + ZATCA's stamping cert) so we can identify
 * exactly which environment each came from.
 *
 * Run: pnpm tsx scripts/zatca/inspect-cleared-xml.ts [INVOICE_NO]
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { X509Certificate } from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INVOICE_NO = process.argv[2] || "INV-2026-0020";

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT zatca_xml, zatca_cleared_xml FROM finance_invoices WHERE invoice_no = $1`,
		[INVOICE_NO],
	);
	const xml = r.rows[0]?.zatca_cleared_xml ?? "";
	if (!xml) { console.error("no cleared xml"); await c.end(); process.exit(1); }

	console.log("════════════════════════════════════════════════════════════");
	console.log("  CLEARED-XML CERTIFICATE WALK");
	console.log("  invoice :", INVOICE_NO);
	console.log("  bytes   :", xml.length);
	console.log("════════════════════════════════════════════════════════════\n");

	const certs = [...xml.matchAll(/<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/g)];
	console.log("X509Certificate elements found:", certs.length, "\n");

	for (let i = 0; i < certs.length; i++) {
		const b64 = certs[i][1].replace(/\s/g, "");
		console.log(`── cert [${i}] (${b64.length} chars base64) ──`);
		try {
			const pem = `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`;
			const cert = new X509Certificate(pem);
			console.log("  Subject:", cert.subject.replace(/\n/g, " | "));
			console.log("  Issuer :", cert.issuer.replace(/\n/g, " | "));
			console.log("  Serial :", cert.serialNumber);
			console.log("  Valid  :", cert.validFrom, "→", cert.validTo);
			const env = (cert.subject + cert.issuer).toLowerCase();
			if (env.includes("prod")) console.log("  >>> contains 'prod'");
			if (env.includes("sim")) console.log("  >>> contains 'sim'");
			if (env.includes("tst")) console.log("  >>> contains 'tst'");
		} catch (e) {
			console.log("  decode error:", (e as Error).message);
		}
		console.log();
	}

	// Extract any reportingStatus / clearanceStatus / UUID echoes
	const m1 = xml.match(/<cbc:UUID[^>]*>([^<]+)<\/cbc:UUID>/);
	console.log("UUID in cleared XML:", m1?.[1] ?? "(none)");

	await c.end();
})();
