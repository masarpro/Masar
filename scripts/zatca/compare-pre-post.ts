/**
 * READ-ONLY: compare the QR Masar generated (signedXmlContent on submission)
 * with the QR after ZATCA cleared the invoice (clearedXml).
 *
 * Run: pnpm tsx scripts/zatca/compare-pre-post.ts INV-2026-0023
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const INV = process.argv[2] || "INV-2026-0023";

function extractQrFromXml(xml: string): string | null {
	const all = [...xml.matchAll(/<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)<\/cbc:EmbeddedDocumentBinaryObject>/g)];
	let qr = "";
	for (const m of all) if (m[1].length > qr.length) qr = m[1];
	return qr || null;
}

function describeTLV(b64: string): string {
	const tlv = Buffer.from(b64, "base64");
	let i = 0, lines: string[] = [];
	while (i < tlv.length) {
		const tag = tlv[i++];
		let len = tlv[i++];
		if (len === 0x81) len = tlv[i++];
		else if (len === 0x82) { len = (tlv[i] << 8) | tlv[i+1]; i += 2; }
		const v = tlv.subarray(i, i + len);
		i += len;
		const head = v.subarray(0, Math.min(20, v.length)).toString("hex");
		lines.push(`Tag ${tag}  len=${len}  head=${head}${v.length > 20 ? "…" : ""}`);
	}
	return `TLV total bytes: ${tlv.length}\n  ` + lines.join("\n  ");
}

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT s.signed_xml_content, s.cleared_xml,
		        i.zatca_cleared_xml AS inv_cleared_xml
		   FROM finance_invoices i
		   JOIN zatca_submissions s ON s.invoice_id = i.id
		  WHERE i.invoice_no = $1
		  ORDER BY s.created_at DESC LIMIT 1`,
		[INV],
	);
	const row = r.rows[0];

	console.log("══ Masar's signed XML (pre-ZATCA) ══");
	const signedQr = extractQrFromXml(row.signed_xml_content ?? "");
	if (signedQr) {
		console.log(describeTLV(signedQr));
		console.log("first 80 chars:", signedQr.substring(0, 80));
	} else {
		console.log("(no QR found in signed_xml_content)");
	}

	console.log("\n══ ZATCA-cleared XML (post-ZATCA) ══");
	const clearedQr = extractQrFromXml(row.cleared_xml ?? row.inv_cleared_xml ?? "");
	if (clearedQr) {
		console.log(describeTLV(clearedQr));
		console.log("first 80 chars:", clearedQr.substring(0, 80));
	} else {
		console.log("(no QR found in cleared_xml)");
	}

	console.log("\n══ DIFF ══");
	console.log("identical?", signedQr === clearedQr ? "✓ YES" : "✗ NO (ZATCA modified the QR)");

	await c.end();
})();
