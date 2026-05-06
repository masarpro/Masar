/**
 * READ-ONLY: Decode ZatcaDevice.csid_certificate to plaintext PEM
 * + extract X.509 issuer/subject to confirm which ZATCA environment
 * issued the certificate (TST vs Production).
 *
 * Run: pnpm tsx scripts/zatca/decode-csid.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { X509Certificate } from "node:crypto";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const ORG_ID = process.argv[2] || null;
const INVOICE_NO = process.argv[3] || "INV-2026-0020";

const SEP = "═".repeat(72);

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	let orgId = ORG_ID;
	if (!orgId) {
		const r = await c.query(
			`SELECT organization_id FROM finance_invoices WHERE invoice_no = $1 LIMIT 1`,
			[INVOICE_NO],
		);
		orgId = r.rows[0]?.organization_id;
	}
	if (!orgId) {
		console.error("Cannot resolve organization_id");
		await c.end();
		process.exit(1);
	}

	const r = await c.query(
		`SELECT invoice_type, status, csid_certificate, compliance_csid,
		        csid_request_id, csid_expires_at, onboarded_at
		   FROM zatca_devices WHERE organization_id = $1`,
		[orgId],
	);

	console.log(SEP);
	console.log("  CSID DECODER");
	console.log("  org_id   :", orgId);
	console.log("  ZATCA_ENV:", process.env.ZATCA_ENVIRONMENT);
	console.log(SEP);

	for (const d of r.rows) {
		console.log("\n══ device:", d.invoice_type, "── status:", d.status, "══");
		console.log("  csid_request_id:", d.csid_request_id);
		console.log("  onboarded_at   :", d.onboarded_at);
		console.log("  expires_at     :", d.csid_expires_at);

		for (const [label, raw] of [
			["PRODUCTION (csid_certificate)", d.csid_certificate],
			["COMPLIANCE (compliance_csid)", d.compliance_csid],
		] as const) {
			console.log(`\n── ${label} ──`);
			if (!raw) { console.log("  (null)"); continue; }
			try {
				const pemBody = Buffer.from(raw, "base64").toString("utf-8")
					.replace(/-----BEGIN CERTIFICATE-----/g, "")
					.replace(/-----END CERTIFICATE-----/g, "")
					.replace(/\s/g, "");
				const pem = `-----BEGIN CERTIFICATE-----\n${pemBody}\n-----END CERTIFICATE-----`;
				const cert = new X509Certificate(pem);
				console.log("  Subject :", cert.subject);
				console.log("  Issuer  :", cert.issuer);
				console.log("  Serial  :", cert.serialNumber);
				console.log("  Valid   : from", cert.validFrom, "to", cert.validTo);

				// Heuristic: TST = simulation/sandbox; PZEINVOICESCA / ZATCA-Code-Signing = production
				const issuerStr = cert.issuer + " " + cert.subject;
				if (/TST/i.test(issuerStr)) {
					console.log("  >>> ENVIRONMENT MARKER: 'TST' → SIMULATION/SANDBOX certificate");
				} else if (/PZEINVOICE/i.test(issuerStr)) {
					console.log("  >>> ENVIRONMENT MARKER: 'PZEINVOICE' → PRODUCTION certificate");
				} else {
					console.log("  >>> ENVIRONMENT MARKER: unclear, manual review needed");
				}
			} catch (e) {
				console.log("  Failed to decode:", (e as Error).message);
			}
		}
	}

	// ─── Inspect cleared XML for the failing invoice ─────────────────
	const cx = await c.query(
		`SELECT zatca_cleared_xml, zatca_xml FROM finance_invoices WHERE invoice_no = $1 LIMIT 1`,
		[INVOICE_NO],
	);
	if (cx.rows[0]?.zatca_cleared_xml) {
		console.log("\n" + SEP);
		console.log("  CLEARED XML SNIPPET (first 800 chars)");
		console.log(SEP);
		console.log(cx.rows[0].zatca_cleared_xml.substring(0, 800));
		console.log("...");
		// Extract Subject from inside cleared XML
		const certMatch = cx.rows[0].zatca_cleared_xml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/);
		if (certMatch) {
			console.log("\n  X509Certificate found in cleared XML — decoding…");
			try {
				const pem = `-----BEGIN CERTIFICATE-----\n${certMatch[1].replace(/\s/g, "")}\n-----END CERTIFICATE-----`;
				const cert = new X509Certificate(pem);
				console.log("  Subject:", cert.subject);
				console.log("  Issuer :", cert.issuer);
			} catch (e) {
				console.log("  decode err:", (e as Error).message);
			}
		}
	}

	await c.end();
})();
