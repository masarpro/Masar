/**
 * READ-ONLY: build a Standard Debit Note (383) and a Standard Credit Note (381)
 * via the production XML builder, then assert that BR-KSA-17 (KSA-10) artefacts
 * are present:
 *   - <cbc:Note> at Invoice level
 *   - <cbc:InstructionNote> inside <cac:PaymentMeans>
 *
 * Run:
 *   pnpm tsx scripts/zatca/verify-debit-note-xml.ts
 *
 * No DB, no network, no production state mutated.
 */

import { buildInvoiceXml } from "../../packages/api/lib/zatca/phase2/xml-builder";
import type { ZatcaInvoiceData } from "../../packages/api/lib/zatca/phase2/types";

const SEP = "═".repeat(72);

const baseInvoice = (
	override: Partial<ZatcaInvoiceData> & Pick<ZatcaInvoiceData, "invoiceTypeCode">,
): ZatcaInvoiceData => ({
	uuid: "00000000-0000-0000-0000-000000000001",
	invoiceNumber: "TEST-0002",
	issueDate: "2026-05-04",
	issueTime: "12:00:00",
	invoiceTypeCode: override.invoiceTypeCode,
	isSimplified: false,
	deliveryDate: "2026-05-04",
	seller: {
		name: "Masar Platform",
		taxNumber: "311181325200003",
		address: { city: "Jeddah", countryCode: "SA" },
	},
	buyer: {
		name: "ZATCA Compliance Test Buyer",
		taxNumber: "300000000000003",
		address: { city: "Riyadh", countryCode: "SA" },
	},
	lineItems: [
		{
			id: "1",
			name: "بند اختبار",
			quantity: 1,
			unitPrice: 100,
			taxCategory: "S",
			taxPercent: 15,
			lineTotal: 100,
		},
	],
	totals: {
		subtotal: 100,
		totalDiscount: 0,
		taxableAmount: 100,
		taxAmount: 15,
		totalWithVat: 115,
		payableAmount: 115,
	},
	billingReference: { invoiceNumber: "TEST-0001" },
	previousInvoiceHash:
		"NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYmUxYjE3ZTExNzA5",
	invoiceCounter: 2,
	...override,
});

function assertContains(xml: string, needle: string, label: string): boolean {
	const ok = xml.includes(needle);
	console.log(`  ${ok ? "✓" : "✗"} ${label}`);
	if (!ok) {
		console.log(`    looking for: ${JSON.stringify(needle)}`);
	}
	return ok;
}

function check(label: string, data: ZatcaInvoiceData) {
	console.log(SEP);
	console.log(`  ${label} — typeCode=${data.invoiceTypeCode} note="${data.noteReason ?? "(none)"}"`);
	console.log(SEP);
	const xml = buildInvoiceXml(data);
	let allOk = true;
	if (data.invoiceTypeCode === "381" || data.invoiceTypeCode === "383") {
		// Must have cbc:Note at invoice level + cbc:InstructionNote in PaymentMeans
		allOk = assertContains(xml, `<cbc:Note>${data.noteReason}</cbc:Note>`, "<cbc:Note> at invoice level (KSA-10)") && allOk;
		allOk = assertContains(xml, `<cbc:InstructionNote>${data.noteReason}</cbc:InstructionNote>`, "<cbc:InstructionNote> inside <cac:PaymentMeans>") && allOk;
		allOk = assertContains(xml, "<cac:BillingReference>", "<cac:BillingReference> present (BR-KSA for credit/debit)") && allOk;
	} else {
		// 388 should NOT have InstructionNote even if noteReason set; cbc:Note may
		// be omitted entirely.
		const hasInstr = xml.includes("<cbc:InstructionNote>");
		console.log(`  ${!hasInstr ? "✓" : "✗"} no <cbc:InstructionNote> for 388`);
		if (hasInstr) allOk = false;
	}
	console.log();
	console.log("  XML preview (first 1200 chars):");
	console.log("  " + xml.slice(0, 1200).replace(/\n/g, "\n  "));
	console.log();
	return allOk;
}

let pass = true;

pass = check("Standard Debit Note (383)", baseInvoice({
	invoiceTypeCode: "383",
	invoiceNumber: "TEST-0002",
	noteReason: "إشعار إضافة - اختبار توافق ZATCA Phase 2",
})) && pass;

pass = check("Standard Credit Note (381)", baseInvoice({
	invoiceTypeCode: "381",
	invoiceNumber: "TEST-0003",
	noteReason: "إشعار خصم - اختبار توافق ZATCA Phase 2",
})) && pass;

pass = check("Standard Tax Invoice (388) — no noteReason", baseInvoice({
	invoiceTypeCode: "388",
	invoiceNumber: "TEST-0001",
	billingReference: undefined as any, // 388 doesn't carry billingRef in fixtures
})) && pass;

console.log(SEP);
console.log(pass ? "  ✅ ALL CHECKS PASS" : "  ❌ ONE OR MORE CHECKS FAILED");
console.log(SEP);
process.exit(pass ? 0 : 1);
