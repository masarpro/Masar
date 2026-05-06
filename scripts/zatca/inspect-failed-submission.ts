/**
 * READ-ONLY: Compare a failed submission (INV-2026-0022) vs a successful one
 * (INV-2026-0020). Extracts the actual ZATCA response payload and any errors.
 *
 * NOTE: ZatcaSubmission schema does NOT store request_url / response_status /
 * response_headers as separate columns — we only have:
 *   - submission_type   ('clearance' | 'reporting')
 *   - status            (PENDING/CLEARED/REPORTED/REJECTED/FAILED)
 *   - zatca_response    (JSON, the parsed ZATCA response object)
 *   - zatca_warnings    (JSON array)
 *   - zatca_errors      (JSON array)
 *   - cleared_xml       (text)
 *   - xml_content / signed_xml_content (the request body XML)
 *
 * The actual URL is computed at runtime as
 *   ZATCA_URLS[process.env.ZATCA_ENVIRONMENT] + ZATCA_PATHS[submission_type+ "/single"]
 * so we infer it from `submission_type` + the runtime env at the moment of the call.
 *
 * Run: pnpm tsx scripts/zatca/inspect-failed-submission.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;

const ZATCA_URLS: Record<string, string> = {
	sandbox:    "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
	simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
	production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
};

const TARGETS = [
	{ no: "INV-2026-0022", label: "FAILED (after switch to simulation)" },
	{ no: "INV-2026-0020", label: "CLEARED (under production)" },
];

const SEP = "═".repeat(72);
const SUB = "─".repeat(72);

function trunc(v: any, n = 600): string {
	if (v === null || v === undefined) return "(null)";
	const s = typeof v === "string" ? v : JSON.stringify(v);
	return s.length > n ? `${s.substring(0, n)}… [${s.length} chars total]` : s;
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	for (const t of TARGETS) {
		console.log("\n" + SEP);
		console.log(`  ${t.no}  —  ${t.label}`);
		console.log(SEP);

		const r = await c.query(
			`SELECT i.id,
			        i.invoice_no,
			        i.zatca_submission_status,
			        i.zatca_invoice_type,
			        i.client_tax_number,
			        i.created_at  AS inv_created,
			        i.zatca_submitted_at,
			        i.zatca_cleared_at,
			        s.id              AS sub_id,
			        s.submission_type,
			        s.status          AS sub_status,
			        s.zatca_response,
			        s.zatca_warnings,
			        s.zatca_errors,
			        s.cleared_xml,
			        s.attempts,
			        s.created_at      AS sub_created
			   FROM finance_invoices i
			   LEFT JOIN zatca_submissions s ON s.invoice_id = i.id
			  WHERE i.invoice_no = $1
			  ORDER BY s.created_at DESC NULLS LAST`,
			[t.no],
		);

		if (!r.rows.length) {
			console.log("  ✗ invoice not found");
			continue;
		}

		const inv = r.rows[0];
		console.log("\n[Invoice]");
		console.log("  inv_id                  ", inv.id);
		console.log("  zatca_submission_status ", inv.zatca_submission_status);
		console.log("  zatca_invoice_type      ", inv.zatca_invoice_type);
		console.log("  client_tax_number       ", inv.client_tax_number);
		console.log("  zatca_submitted_at      ", inv.zatca_submitted_at);
		console.log("  zatca_cleared_at        ", inv.zatca_cleared_at);
		console.log("  invoice created_at      ", inv.inv_created);

		const subs = r.rows.filter((row) => row.sub_id);
		console.log(`\n[Submission rows: ${subs.length}]`);
		if (!subs.length) {
			console.log("  ✗ NO row in zatca_submissions — Phase 2 never recorded an attempt for this invoice.");
			console.log("    (either Phase 1 fallback OR processInvoiceForZatca threw before db.zatcaSubmission.create)");
			continue;
		}

		for (let k = 0; k < subs.length; k++) {
			const s = subs[k];
			console.log(SUB);
			console.log(`  attempt #${k + 1} (sub_id=${s.sub_id})`);
			console.log("    submission_type   :", s.submission_type);
			console.log("    status            :", s.sub_status);
			console.log("    attempts          :", s.attempts);
			console.log("    sub created_at    :", s.sub_created);

			// Infer URL: zatca_environment is read at request time. We don't store
			// it, so list both candidates the user mentioned + show actual path.
			const apiPath = s.submission_type === "clearance"
				? "/invoices/clearance/single"
				: "/invoices/reporting/single";
			console.log("    inferred URL      : <ZATCA_URLS[ENV at runtime]>" + apiPath);
			console.log("       if ENV=production  → " + ZATCA_URLS.production + apiPath);
			console.log("       if ENV=simulation  → " + ZATCA_URLS.simulation + apiPath);
			console.log("       if ENV=sandbox     → " + ZATCA_URLS.sandbox + apiPath);

			console.log("\n    zatca_errors     (JSON):");
			console.log("      " + trunc(s.zatca_errors, 1500));
			console.log("\n    zatca_warnings   (JSON, first 600):");
			console.log("      " + trunc(s.zatca_warnings, 600));
			console.log("\n    zatca_response   (JSON, first 1200):");
			console.log("      " + trunc(s.zatca_response, 1200));

			// If response includes embedded HTTP-level info, surface it
			if (s.zatca_response && typeof s.zatca_response === "object") {
				const resp = s.zatca_response as any;
				console.log("\n    parsed response fields:");
				console.log("      success           :", resp.success);
				console.log("      status            :", resp.status);
				console.log("      clearedInvoice?   :", resp.clearedInvoice ? `present (${resp.clearedInvoice.length} chars)` : "(none)");
				if (Array.isArray(resp.errors) && resp.errors.length) {
					console.log("      errors[]:");
					for (const e of resp.errors) console.log("        -", JSON.stringify(e));
				}
				if (Array.isArray(resp.warnings) && resp.warnings.length) {
					console.log(`      warnings[] count   : ${resp.warnings.length}`);
				}
			}
		}
	}

	console.log("\n" + SEP);
	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
