/**
 * READ-ONLY ZATCA Invoice Inspector
 *
 * Inspects a single invoice + the ZatcaDevice that processed it,
 * to diagnose why a "Cleared by ZATCA" invoice doesn't show up in
 * the Fatoora portal counter (invoicegen.zatca.gov.sa/list).
 *
 * Run: pnpm tsx scripts/zatca/inspect-invoice.ts [INVOICE_NO]
 *
 * Defaults to INV-2026-0020 if no argument given.
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL / DIRECT_URL not found in environment");
	process.exit(1);
}

const INVOICE_NO = process.argv[2] || "INV-2026-0020";

const SEP = "═".repeat(72);
const SUB = "─".repeat(72);

function trunc(s: any, n = 80): string {
	if (s === null || s === undefined) return "(null)";
	const str = typeof s === "string" ? s : JSON.stringify(s);
	return str.length > n ? `${str.substring(0, n)}… [${str.length} chars total]` : str;
}

function row(label: string, value: any) {
	console.log(`  ${label.padEnd(34)} ${value}`);
}

(async () => {
	const client = new pg.Client({ connectionString: DATABASE_URL });
	await client.connect();

	console.log(SEP);
	console.log("  ZATCA INVOICE INSPECTOR");
	console.log("  invoiceNo:", INVOICE_NO);
	console.log("  ZATCA_ENV:", process.env.ZATCA_ENVIRONMENT || "(unset → defaults to 'simulation')");
	console.log("  Date     :", new Date().toISOString());
	console.log(SEP);
	console.log();

	// ─── 1) Invoice ────────────────────────────────────────────────────
	const invRes = await client.query(
		`SELECT i.*,
		        o."taxNumber" AS org_tax,
		        o.name        AS org_name,
		        o.id          AS org_id,
		        c.tax_number AS client_tax_in_clients_table
		   FROM finance_invoices i
		   JOIN organization o ON o.id = i.organization_id
		   LEFT JOIN clients c ON c.id = i.client_id
		  WHERE i.invoice_no = $1
		  LIMIT 1`,
		[INVOICE_NO],
	);

	if (!invRes.rows.length) {
		console.error(`✗ Invoice "${INVOICE_NO}" not found`);
		await client.end();
		process.exit(2);
	}

	const inv = invRes.rows[0];
	const orgId = inv.organization_id;

	console.log("[1] INVOICE RECORD (finance_invoices)");
	console.log(SUB);
	row("id", inv.id);
	row("invoice_no", inv.invoice_no);
	row("invoice_type (DB enum)", inv.invoice_type); // STANDARD / SIMPLIFIED / TAX / CREDIT_NOTE
	row("zatca_invoice_type", inv.zatca_invoice_type); // STANDARD / SIMPLIFIED (per ZATCA)
	row("zatca_submission_status", inv.zatca_submission_status);
	row("status", inv.status);
	row("issue_date", inv.issue_date);
	row("issued_at", inv.issued_at);
	row("total_amount", inv.total_amount);
	row("vat_amount", inv.vat_amount);
	row("client_name", inv.client_name);
	row("client_tax_number (frozen on invoice)", inv.client_tax_number || "(null → SIMPLIFIED!)");
	row("client_tax in clients table",         inv.client_tax_in_clients_table || "(null)");
	row("seller_tax_number (frozen)", inv.seller_tax_number);
	row("zatca_uuid", inv.zatca_uuid);
	row("zatca_hash", trunc(inv.zatca_hash, 50));
	row("zatca_counter_value", inv.zatca_counter_value);
	row("zatca_previous_hash", trunc(inv.zatca_previous_hash, 50));
	row("zatca_signature length", inv.zatca_signature?.length || 0);
	row("qr_code length", inv.qr_code?.length || 0);
	row("zatca_xml length", inv.zatca_xml?.length || 0);
	row("zatca_cleared_xml length", inv.zatca_cleared_xml?.length || 0);
	row("zatca_submitted_at", inv.zatca_submitted_at);
	row("zatca_cleared_at", inv.zatca_cleared_at);
	console.log();

	// ─── 2) The submission record (FROM ZatcaSubmission) ───────────────
	const subRes = await client.query(
		`SELECT id, submission_type, status, invoice_hash,
		        zatca_response, zatca_warnings, zatca_errors,
		        device_id, created_at
		   FROM zatca_submissions
		  WHERE invoice_id = $1
		  ORDER BY created_at DESC
		  LIMIT 5`,
		[inv.id],
	).catch((err) => {
		console.warn("(zatca_submissions table missing or empty — skipping)", err.message);
		return { rows: [] };
	});

	console.log("[2] ZATCA SUBMISSIONS (zatca_submissions)");
	console.log(SUB);
	if (!subRes.rows.length) {
		console.log("  ✗ NO submission record found — Phase 2 NEVER reached the API call");
		console.log("    (organization is on Phase 1, OR Phase 2 fell back silently)");
	} else {
		for (const s of subRes.rows) {
			console.log("  ── submission ──");
			row("submission_type", s.submission_type); // 'reporting' or 'clearance'
			row("status", s.status);
			row("device_id", s.device_id);
			row("created_at", s.created_at);
			row("invoice_hash", trunc(s.invoice_hash, 50));
			row("zatca_response (status field)", s.zatca_response?.status ?? "(none)");
			row("zatca_warnings", JSON.stringify(s.zatca_warnings)?.substring(0, 200));
			row("zatca_errors", JSON.stringify(s.zatca_errors)?.substring(0, 200));
			console.log("    full zatca_response (truncated 500):");
			console.log("    " + trunc(s.zatca_response, 500));
		}
	}
	console.log();

	// ─── 3) ZatcaDevice ────────────────────────────────────────────────
	const devRes = await client.query(
		`SELECT id, invoice_type, status, csid_request_id,
		        csid_certificate, csid_secret,
		        compliance_csid, compliance_secret,
		        csid_expires_at, onboarded_at, last_error,
		        invoice_counter, previous_invoice_hash,
		        created_at, updated_at
		   FROM zatca_devices
		  WHERE organization_id = $1
		  ORDER BY created_at DESC`,
		[orgId],
	);

	console.log("[3] ZATCA DEVICES (zatca_devices)");
	console.log(SUB);
	if (!devRes.rows.length) {
		console.log("  ✗ NO ZatcaDevice — org is on Phase 1");
	} else {
		for (const d of devRes.rows) {
			console.log(`  ── device ${d.invoice_type} ──`);
			row("id", d.id);
			row("status", d.status); // ACTIVE / COMPLIANCE / ...
			row("invoice_type", d.invoice_type);
			row("invoice_counter", d.invoice_counter);
			row("previous_invoice_hash", trunc(d.previous_invoice_hash, 50));
			row("csid_request_id", d.csid_request_id);
			row("onboarded_at", d.onboarded_at);
			row("csid_certificate length", d.csid_certificate?.length || 0);
			row("csid_secret length (encrypted)", d.csid_secret?.length || 0);
			row("compliance_csid length", d.compliance_csid?.length || 0);
			row("compliance_secret length (encrypted)", d.compliance_secret?.length || 0);

			// Critical: Is csid_certificate the SAME as compliance_csid?
			// If yes → productionResult.csid was undefined and onboarding fell back
			// to the compliance cert (start-onboarding.ts:333,350).
			const sameAsCompliance = !!(d.csid_certificate && d.compliance_csid &&
				d.csid_certificate === d.compliance_csid);
			row("csid_certificate == compliance_csid?", sameAsCompliance ? "⚠️  YES (no production CSID!)" : "no (production cert distinct)");

			// Decode the certificate to peek at the issuer + subject
			if (d.csid_certificate) {
				try {
					const decoded = Buffer.from(d.csid_certificate, "base64").toString("utf-8");
					const beginIdx = decoded.indexOf("-----BEGIN CERTIFICATE-----");
					if (beginIdx >= 0) {
						console.log("    csid_certificate decodes to PEM (first 80 chars after BEGIN line):");
						const after = decoded.substring(beginIdx + 28).split(/\r?\n/)[0];
						console.log("    " + (after || "(empty)").substring(0, 80));
						// Issuer hint: simulation certs typically have "TSTZATCA-Code-Signing" template
						// production certs have "ZATCA-Code-Signing"
						if (decoded.includes("TST")) console.log("    ⚠️  contains 'TST' → likely SIMULATION/SANDBOX certificate");
					} else {
						console.log("    csid_certificate first 80 chars:", decoded.substring(0, 80));
					}
				} catch {
					console.log("    csid_certificate is not base64-decodable to PEM");
				}
			}

			row("last_error", trunc(d.last_error, 200));
			row("created_at", d.created_at);
			row("updated_at", d.updated_at);
		}
	}
	console.log();

	// ─── 4) Verdict ────────────────────────────────────────────────────
	console.log("[4] VERDICT");
	console.log(SUB);
	const findings: string[] = [];

	const env = process.env.ZATCA_ENVIRONMENT || "(unset → 'simulation')";
	if (env.toLowerCase() === "sandbox") {
		findings.push("🔴 ZATCA_ENVIRONMENT=sandbox → calls hit /e-invoicing/developer-portal — NOT the production Fatoora portal counter.");
	} else if (env.toLowerCase() === "simulation") {
		findings.push("🟡 ZATCA_ENVIRONMENT=simulation → calls hit /e-invoicing/simulation. invoicegen.zatca.gov.sa/list IS the simulation portal — invoices SHOULD show there if onboarding was also done in 'simulation'.");
	} else if (env.toLowerCase() === "production") {
		findings.push("🟢 ZATCA_ENVIRONMENT=production → calls hit /e-invoicing/core (live ZATCA).");
	} else {
		findings.push(`⚠️  ZATCA_ENVIRONMENT=${env} (unknown) — defaults to 'simulation'.`);
	}

	if (!subRes.rows.length) {
		findings.push("🔴 No zatca_submissions row → API call NEVER made. Despite the UI showing 'cleared', the invoice was processed as Phase 1 (silent fallback) or processInvoiceForZatca threw before submission.");
	}

	if (inv.zatca_invoice_type === "SIMPLIFIED" && !inv.client_tax_number) {
		findings.push("🟡 invoice marked SIMPLIFIED because client_tax_number is null → routed to /invoices/reporting/single (B2C). For Fatoora portal counter testing you'd typically issue a STANDARD/B2B invoice with a buyer VAT.");
	}

	for (const f of findings) console.log("  " + f);

	console.log();
	console.log(SEP);
	await client.end();
	process.exit(0);
})().catch((err) => {
	console.error("FATAL:", err);
	process.exit(1);
});
