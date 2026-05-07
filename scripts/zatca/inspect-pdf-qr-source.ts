/**
 * READ-ONLY: Inspect what's actually stored in finance_invoices.qr_code
 * for several invoices, to confirm the PDF source format.
 *
 * Run: pnpm tsx scripts/zatca/inspect-pdf-qr-source.ts
 */

import pg from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env.local") });

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!;

const TARGETS = ["INV-2026-0016", "INV-2026-0024", "INV-2026-0025", "INV-2026-0026"];

(async () => {
	const c = new pg.Client({ connectionString: DATABASE_URL });
	await c.connect();

	const r = await c.query(
		`SELECT invoice_no, qr_code, zatca_submission_status, issued_at,
		        LENGTH(qr_code) AS qr_len
		   FROM finance_invoices
		  WHERE invoice_no = ANY($1::text[])
		  ORDER BY invoice_no`,
		[TARGETS],
	);

	for (const row of r.rows) {
		console.log("══════════════════════════════════════════════════════════");
		console.log("Invoice :", row.invoice_no);
		console.log("Status  :", row.zatca_submission_status);
		console.log("Issued  :", row.issued_at);
		console.log("QR len  :", row.qr_len, "chars");

		const qr: string = row.qr_code ?? "";
		let format: string;
		if (qr.startsWith("data:image")) format = "PNG data URL";
		else if (qr.startsWith("<svg")) format = "SVG";
		else if (qr.length > 0) format = "raw TLV base64";
		else format = "(empty)";
		console.log("Format  :", format);
		console.log("Preview :", qr.substring(0, 100), qr.length > 100 ? "…" : "");

		if (qr.startsWith("data:image")) {
			const base64Part = qr.split(",")[1] ?? "";
			const pngBytes = Buffer.from(base64Part, "base64");
			console.log("PNG size:", pngBytes.length, "bytes");
			// PNG signature: 89 50 4E 47 0D 0A 1A 0A
			const isPng = pngBytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
			console.log("Valid PNG signature:", isPng ? "✓" : "✗");
			// Read IHDR (image dimensions): bytes 16-19 width, 20-23 height
			if (isPng && pngBytes.length > 24) {
				const w = pngBytes.readUInt32BE(16);
				const h = pngBytes.readUInt32BE(20);
				console.log("Image dims:", w, "x", h);
			}
		} else if (qr.length > 0 && format === "raw TLV base64") {
			try {
				const buf = Buffer.from(qr, "base64");
				let off = 0;
				const tags: number[] = [];
				while (off < buf.length) {
					tags.push(buf[off]!);
					let len = buf[off + 1]!;
					if (len === 0x81) { off++; len = buf[off + 1]!; }
					off += 2 + len;
				}
				console.log("TLV tags  :", tags.join(", "), `(${tags.length} total)`);
				console.log("TLV bytes :", buf.length);
			} catch (e) {
				console.log("Could not parse as TLV:", (e as Error).message);
			}
		}
		console.log();
	}

	await c.end();
})().catch((err) => { console.error("FATAL:", err); process.exit(1); });
