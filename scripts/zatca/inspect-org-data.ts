/**
 * READ-ONLY ZATCA Onboarding Data Inspector
 *
 * Validates that the organization's data is well-formed for ZATCA Phase 2 CSR
 * generation BEFORE attempting onboarding. Read-only — no DB modifications.
 *
 * Run: pnpm tsx scripts/zatca/inspect-org-data.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL / DIRECT_URL not found in environment");
	process.exit(1);
}

// Org slug from the failed onboarding URL
const ORG_SLUG = process.env.ZATCA_ORG_SLUG || "mnshat-omran-alkhaleej";

const SEP = "═".repeat(70);
const SUB = "─".repeat(70);

function ascii(s: string | null | undefined): string {
	if (!s) return "(null)";
	return JSON.stringify(s);
}
function hasNonAscii(s: string | null | undefined): boolean {
	if (!s) return false;
	return /[^\x20-\x7E]/.test(s);
}
function nonPrintableChars(s: string): string[] {
	const bad: string[] = [];
	for (const ch of s) {
		const cp = ch.codePointAt(0)!;
		// PrintableString allows: A-Z a-z 0-9 ' ( ) + , - . / : = ? and space
		const okASCII = (cp >= 0x20 && cp <= 0x7e);
		const printable = /[A-Za-z0-9'()+,\-./:=? ]/.test(ch);
		if (!okASCII || !printable) {
			bad.push(`U+${cp.toString(16).padStart(4, "0")} (${JSON.stringify(ch)})`);
		}
	}
	return bad;
}

function row(label: string, value: any, ok?: boolean | null) {
	const tag = ok === undefined || ok === null ? "  " : ok ? "✓ " : "✗ ";
	console.log(`  ${tag}${label.padEnd(34)} ${value}`);
}

(async () => {
	const client = new pg.Client({ connectionString: DATABASE_URL });
	await client.connect();

	console.log(SEP);
	console.log("  ZATCA ONBOARDING — ORGANIZATION DATA INSPECTOR");
	console.log("  Org slug:", ORG_SLUG);
	console.log("  Date    :", new Date().toISOString());
	console.log(SEP);
	console.log();

	const res = await client.query(
		`SELECT id, slug, name, "commercialRegister", "taxNumber",
		        phone, address, city
		   FROM organization
		  WHERE slug = $1
		  LIMIT 1`,
		[ORG_SLUG],
	);
	if (!res.rows.length) {
		console.error(`✗ Organization with slug "${ORG_SLUG}" not found`);
		await client.end();
		process.exit(2);
	}
	const org = res.rows[0];

	// Look up financeSettings (where /settings/general writes the tax number too)
	const fsRes = await client.query(
		`SELECT id, "tax_number", "commercial_reg"
		   FROM organization_finance_settings
		  WHERE "organizationId" = $1
		  LIMIT 1`,
		[org.id],
	).catch(() => ({ rows: [] }));
	const fs = fsRes.rows[0] ?? null;

	// Look up active ZatcaDevice (if any)
	const devRes = await client.query(
		`SELECT id, status, "invoiceType", "lastError", "csidRequestId",
		        "onboardedAt", "createdAt", "updatedAt"
		   FROM zatca_device
		  WHERE "organizationId" = $1
		  ORDER BY "createdAt" DESC`,
		[org.id],
	).catch(() => ({ rows: [] }));

	console.log("[1] ORGANIZATION RECORD");
	console.log(SUB);
	row("id", ascii(org.id));
	row("slug", ascii(org.slug));
	row("name (raw)", ascii(org.name));
	row("name byte-length (UTF8)", Buffer.byteLength(org.name ?? "", "utf8"));
	row("name has non-ASCII", hasNonAscii(org.name), !hasNonAscii(org.name));
	if (org.name) {
		const bad = nonPrintableChars(org.name);
		row("name PrintableString-illegal chars", bad.length === 0 ? "[]" : bad.join(", "), bad.length === 0);
		const ascii = (org.name as string).replace(/[^\x20-\x7E]/g, "").trim();
		row("name → ASCII strip → fallback", ascii ? `"${ascii}"` : '(empty → "Masar Platform")');
	}
	row("commercialRegister", ascii(org.commercialRegister));
	row("taxNumber", ascii(org.taxNumber));
	row("city", ascii(org.city));
	row("address", ascii(org.address));
	row("phone", ascii(org.phone));
	console.log();

	console.log("[2] FINANCE SETTINGS");
	console.log(SUB);
	if (!fs) {
		row("financeSettings", "(none)");
	} else {
		row("fs.tax_number", ascii(fs.tax_number));
		row("fs.commercial_reg", ascii(fs.commercial_reg));
	}
	console.log();

	console.log("[3] RESOLVED VAT NUMBER (per start-onboarding.ts logic)");
	console.log(SUB);
	const resolvedVat = (fs?.tax_number || org.taxNumber) ?? null;
	const cleanedVat = resolvedVat ? resolvedVat.replace(/[\s-]/g, "") : null;
	row("resolved (fs ?? org)", ascii(resolvedVat));
	row("cleaned (no space/dash)", ascii(cleanedVat));
	const lenOk = cleanedVat?.length === 15;
	row("length == 15", String(cleanedVat?.length ?? 0), lenOk);
	const onlyDigits = cleanedVat ? /^\d{15}$/.test(cleanedVat) : false;
	row("matches /^\\d{15}$/", String(onlyDigits), onlyDigits);
	const zatcaShape = cleanedVat ? /^3\d{13}3$/.test(cleanedVat) : false;
	row("matches ZATCA /^3\\d{13}3$/", String(zatcaShape), zatcaShape);
	const startsThree = cleanedVat?.startsWith("3");
	const endsThree = cleanedVat?.endsWith("3");
	row("starts with 3", String(startsThree), startsThree);
	row("ends with 3", String(endsThree), endsThree);
	console.log();

	console.log("[4] FIELDS ENTERING THE CSR (computed)");
	console.log(SUB);
	const env = process.env.ZATCA_ENVIRONMENT || "production";
	row("ZATCA_ENVIRONMENT", env);
	const cn = env === "production" ? `MASAR-EGS-${cleanedVat}` : `TST-886431145-${cleanedVat}`;
	row("CN (commonName)", `"${cn}"`);
	row("  CN length", String(cn.length));
	row("  CN PrintableString-clean", String(nonPrintableChars(cn).length === 0), nonPrintableChars(cn).length === 0);
	const orgAscii = (org.name ?? "").replace(/[^\x20-\x7E]/g, "").trim() || "Masar Platform";
	row("O (organizationName)", `"${orgAscii}"`);
	const branchOU = org.city || "Jeddah";
	row("OU (organizationalUnitName)", `"${branchOU}"`);
	const location = org.city || "Jeddah";
	row("registeredAddress (SAN)", `"${location}"`);
	row("businessCategory (SAN)", `"Construction"`);
	const snPrefix = env === "production" ? "1-Masar|2-EGS1|3-" : "1-TST|2-TST|3-";
	row("SN prefix", `"${snPrefix}"`);
	const templateName = env === "production" ? "ZATCA-Code-Signing" : "TSTZATCA-Code-Signing";
	row("templateName", `"${templateName}"`);
	console.log();

	console.log("[5] EXISTING ZATCA DEVICES");
	console.log(SUB);
	if (!devRes.rows.length) {
		row("count", "0 (no devices yet)");
	} else {
		for (const d of devRes.rows) {
			console.log(
				`  • ${d.invoiceType.padEnd(10)} status=${d.status.padEnd(10)} ` +
				`onboarded=${d.onboardedAt ? "YES" : "no"} ` +
				`updatedAt=${new Date(d.updatedAt).toISOString()}`,
			);
			if (d.lastError) console.log(`    lastError: ${d.lastError}`);
		}
	}
	console.log();

	console.log("[6] FINAL VERDICT");
	console.log(SUB);
	const blockers: string[] = [];
	if (!cleanedVat) blockers.push("VAT number missing");
	if (!lenOk) blockers.push("VAT not 15 digits");
	if (!onlyDigits) blockers.push("VAT contains non-digits");
	if (!zatcaShape) blockers.push("VAT shape doesn't match /^3\\d{13}3$/");
	if (hasNonAscii(org.name)) blockers.push("Org name has non-ASCII (will be stripped to fallback)");
	if (blockers.length === 0) {
		console.log("  ✓ All input fields look ZATCA-valid for CSR generation.");
	} else {
		console.log("  ✗ Issues that may cause Invalid-CSR / Invalid-OTP:");
		for (const b of blockers) console.log(`    - ${b}`);
	}

	console.log();
	console.log(SEP);
	await client.end();
	process.exit(0);
})().catch((err) => {
	console.error("FATAL:", err);
	process.exit(1);
});
