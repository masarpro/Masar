/**
 * ZATCA Phase 2 — UBL 2.1 XML Builder
 *
 * Builds a complete UBL 2.1 Invoice XML document per ZATCA XML Implementation
 * Standards v2. Element ordering is critical — ZATCA validates sequence.
 *
 * References:
 * - ZATCA XML Implementation Standard v2
 * - UBL 2.1 Invoice schema
 * - UN/CEFACT code lists (1001, 5305, 6523)
 */

import { create } from "xmlbuilder2";
import {
	UBL_NAMESPACES,
	TAX_SCHEME_ID,
	DEFAULT_CURRENCY,
	UBL_PROFILE_ID,
	INVOICE_SUBTYPE,
} from "./constants";
import type { ZatcaInvoiceData, ZatcaLineItem, ZatcaAddress } from "./types";

/**
 * Build a UBL 2.1 Invoice XML document from invoice data.
 *
 * The returned XML does NOT include UBLExtensions/Signature — those are
 * added by invoice-signer.ts after hashing and signing.
 *
 * @returns XML string (non-pretty-printed, canonical order)
 */
export function buildInvoiceXml(data: ZatcaInvoiceData): string {
	const doc = create({ version: "1.0", encoding: "UTF-8" });

	const inv = doc
		.ele(UBL_NAMESPACES.invoice, "Invoice")
		.att("xmlns:cac", UBL_NAMESPACES.cac)
		.att("xmlns:cbc", UBL_NAMESPACES.cbc)
		.att("xmlns:ext", UBL_NAMESPACES.ext);

	// 1. ProfileID
	inv.ele(UBL_NAMESPACES.cbc, "cbc:ProfileID").txt(UBL_PROFILE_ID);

	// 2. ID (invoice number)
	inv.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(data.invoiceNumber);

	// 3. UUID
	inv.ele(UBL_NAMESPACES.cbc, "cbc:UUID").txt(data.uuid);

	// 4. IssueDate + IssueTime
	inv.ele(UBL_NAMESPACES.cbc, "cbc:IssueDate").txt(data.issueDate);
	inv.ele(UBL_NAMESPACES.cbc, "cbc:IssueTime").txt(data.issueTime);

	// 5. InvoiceTypeCode
	const subtype = data.isSimplified ? INVOICE_SUBTYPE.SIMPLIFIED : INVOICE_SUBTYPE.STANDARD;
	inv
		.ele(UBL_NAMESPACES.cbc, "cbc:InvoiceTypeCode")
		.att("name", subtype)
		.txt(data.invoiceTypeCode);

	// 6. DocumentCurrencyCode + TaxCurrencyCode
	inv.ele(UBL_NAMESPACES.cbc, "cbc:DocumentCurrencyCode").txt(DEFAULT_CURRENCY);
	inv.ele(UBL_NAMESPACES.cbc, "cbc:TaxCurrencyCode").txt(DEFAULT_CURRENCY);

	// 7. BillingReference (credit/debit notes only)
	if (data.billingReference) {
		const br = inv.ele(UBL_NAMESPACES.cac, "cac:BillingReference");
		const ref = br.ele(UBL_NAMESPACES.cac, "cac:InvoiceDocumentReference");
		ref.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(data.billingReference.invoiceNumber);
		if (data.billingReference.invoiceUuid) {
			ref.ele(UBL_NAMESPACES.cbc, "cbc:UUID").txt(data.billingReference.invoiceUuid);
		}
	}

	// 8. AdditionalDocumentReference — ICV (Invoice Counter Value)
	addAdditionalDocRef(inv, "ICV", String(data.invoiceCounter));

	// 9. AdditionalDocumentReference — PIH (Previous Invoice Hash)
	addPIHDocRef(inv, data.previousInvoiceHash);

	// 10. QR code reference — placeholder, added after signing
	// (The signer will inject this)

	// 11. AccountingSupplierParty
	addSupplierParty(inv, data.seller);

	// 12. AccountingCustomerParty
	if (data.buyer) {
		addCustomerParty(inv, data.buyer);
	} else if (!data.isSimplified) {
		// B2B requires buyer — should not happen if validation is correct
		throw new Error("Buyer is required for standard (B2B) invoices");
	}

	// 13. AllowanceCharge (invoice-level discount)
	if (data.totals.totalDiscount > 0) {
		const ac = inv.ele(UBL_NAMESPACES.cac, "cac:AllowanceCharge");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:ChargeIndicator").txt("false");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceChargeReason").txt("discount");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:Amount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(data.totals.totalDiscount));
		const taxCat = ac.ele(UBL_NAMESPACES.cac, "cac:TaxCategory");
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt("S");
		taxCat
			.ele(UBL_NAMESPACES.cbc, "cbc:Percent")
			.txt(formatAmount(aggregateTaxPercent(data.lineItems)));
		const taxScheme = taxCat.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
		taxScheme.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}

	// 14. TaxTotal (SAR amounts)
	addTaxTotal(inv, data);

	// 15. TaxTotal (tax currency — same as SAR for Saudi)
	const taxTotal2 = inv.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	taxTotal2
		.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(data.totals.taxAmount));

	// 16. LegalMonetaryTotal
	addLegalMonetaryTotal(inv, data.totals);

	// 17. InvoiceLines
	for (const item of data.lineItems) {
		addInvoiceLine(inv, item);
	}

	return doc.end({ prettyPrint: false });
}

// ─── Helper: AdditionalDocumentReference ────────────────────────────────

function addAdditionalDocRef(parent: ReturnType<typeof create>, id: string, value: string): void {
	const ref = parent.ele(UBL_NAMESPACES.cac, "cac:AdditionalDocumentReference");
	ref.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(id);
	ref.ele(UBL_NAMESPACES.cbc, "cbc:UUID").txt(value);
}

function addPIHDocRef(parent: ReturnType<typeof create>, hash: string): void {
	const ref = parent.ele(UBL_NAMESPACES.cac, "cac:AdditionalDocumentReference");
	ref.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt("PIH");
	const att = ref.ele(UBL_NAMESPACES.cac, "cac:Attachment");
	att
		.ele(UBL_NAMESPACES.cbc, "cbc:EmbeddedDocumentBinaryObject")
		.att("mimeCode", "text/plain")
		.txt(hash);
}

// ─── Helper: Supplier Party ─────────────────────────────────────────────

function addSupplierParty(
	parent: ReturnType<typeof create>,
	seller: ZatcaInvoiceData["seller"],
): void {
	const sp = parent.ele(UBL_NAMESPACES.cac, "cac:AccountingSupplierParty");
	const party = sp.ele(UBL_NAMESPACES.cac, "cac:Party");

	// PartyIdentification — CR number
	if (seller.crNumber) {
		const pid = party.ele(UBL_NAMESPACES.cac, "cac:PartyIdentification");
		pid
			.ele(UBL_NAMESPACES.cbc, "cbc:ID")
			.att("schemeID", "CRN")
			.txt(seller.crNumber);
	}

	// PostalAddress
	addAddress(party, seller.address);

	// PartyTaxScheme
	const pts = party.ele(UBL_NAMESPACES.cac, "cac:PartyTaxScheme");
	pts.ele(UBL_NAMESPACES.cbc, "cbc:CompanyID").txt(seller.taxNumber);
	const ts = pts.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
	ts.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);

	// PartyLegalEntity
	const ple = party.ele(UBL_NAMESPACES.cac, "cac:PartyLegalEntity");
	ple.ele(UBL_NAMESPACES.cbc, "cbc:RegistrationName").txt(seller.name);
}

// ─── Helper: Customer Party ─────────────────────────────────────────────

function addCustomerParty(
	parent: ReturnType<typeof create>,
	buyer: NonNullable<ZatcaInvoiceData["buyer"]>,
): void {
	const cp = parent.ele(UBL_NAMESPACES.cac, "cac:AccountingCustomerParty");
	const party = cp.ele(UBL_NAMESPACES.cac, "cac:Party");

	// PostalAddress
	if (buyer.address) {
		addAddress(party, {
			city: buyer.address.city ?? "",
			countryCode: buyer.address.countryCode ?? "SA",
			street: buyer.address.street,
			postalCode: buyer.address.postalCode,
		});
	}

	// PartyTaxScheme
	if (buyer.taxNumber) {
		const pts = party.ele(UBL_NAMESPACES.cac, "cac:PartyTaxScheme");
		pts.ele(UBL_NAMESPACES.cbc, "cbc:CompanyID").txt(buyer.taxNumber);
		const ts = pts.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
		ts.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}

	// PartyLegalEntity
	const ple = party.ele(UBL_NAMESPACES.cac, "cac:PartyLegalEntity");
	ple.ele(UBL_NAMESPACES.cbc, "cbc:RegistrationName").txt(buyer.name);
}

// ─── Helper: Address ────────────────────────────────────────────────────

function addAddress(parent: ReturnType<typeof create>, addr: ZatcaAddress): void {
	const pa = parent.ele(UBL_NAMESPACES.cac, "cac:PostalAddress");
	if (addr.street) {
		pa.ele(UBL_NAMESPACES.cbc, "cbc:StreetName").txt(addr.street);
	}
	if (addr.buildingNumber) {
		pa.ele(UBL_NAMESPACES.cbc, "cbc:BuildingNumber").txt(addr.buildingNumber);
	}
	if (addr.district) {
		pa.ele(UBL_NAMESPACES.cbc, "cbc:CitySubdivisionName").txt(addr.district);
	}
	if (addr.city) {
		pa.ele(UBL_NAMESPACES.cbc, "cbc:CityName").txt(addr.city);
	}
	if (addr.postalCode) {
		pa.ele(UBL_NAMESPACES.cbc, "cbc:PostalZone").txt(addr.postalCode);
	}
	const country = pa.ele(UBL_NAMESPACES.cac, "cac:Country");
	country.ele(UBL_NAMESPACES.cbc, "cbc:IdentificationCode").txt(addr.countryCode);
}

// ─── Helper: TaxTotal ───────────────────────────────────────────────────

function addTaxTotal(parent: ReturnType<typeof create>, data: ZatcaInvoiceData): void {
	const tt = parent.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	tt.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(data.totals.taxAmount));

	// Group line items by tax category
	const groups = groupByTaxCategory(data.lineItems);

	for (const [category, items] of Object.entries(groups)) {
		const subtotal = tt.ele(UBL_NAMESPACES.cac, "cac:TaxSubtotal");
		const taxableSum = items.reduce((sum, it) => sum + it.lineTotal, 0);
		const taxSum = items.reduce(
			(sum, it) => sum + it.lineTotal * (it.taxPercent / 100),
			0,
		);

		subtotal
			.ele(UBL_NAMESPACES.cbc, "cbc:TaxableAmount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(taxableSum));
		subtotal
			.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(taxSum));

		const taxCat = subtotal.ele(UBL_NAMESPACES.cac, "cac:TaxCategory");
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(category);
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:Percent").txt(String(items[0]!.taxPercent));
		const taxScheme = taxCat.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
		taxScheme.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}
}

// ─── Helper: LegalMonetaryTotal ─────────────────────────────────────────

function addLegalMonetaryTotal(
	parent: ReturnType<typeof create>,
	totals: ZatcaInvoiceData["totals"],
): void {
	const lmt = parent.ele(UBL_NAMESPACES.cac, "cac:LegalMonetaryTotal");

	lmt
		.ele(UBL_NAMESPACES.cbc, "cbc:LineExtensionAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(totals.subtotal));
	lmt
		.ele(UBL_NAMESPACES.cbc, "cbc:TaxExclusiveAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(totals.taxableAmount));
	lmt
		.ele(UBL_NAMESPACES.cbc, "cbc:TaxInclusiveAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(totals.totalWithVat));

	if (totals.totalDiscount > 0) {
		lmt
			.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceTotalAmount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(totals.totalDiscount));
	}

	if (totals.prepaidAmount && totals.prepaidAmount > 0) {
		lmt
			.ele(UBL_NAMESPACES.cbc, "cbc:PrepaidAmount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(totals.prepaidAmount));
	}

	lmt
		.ele(UBL_NAMESPACES.cbc, "cbc:PayableAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(totals.payableAmount));
}

// ─── Helper: InvoiceLine ────────────────────────────────────────────────

function addInvoiceLine(parent: ReturnType<typeof create>, item: ZatcaLineItem): void {
	const line = parent.ele(UBL_NAMESPACES.cac, "cac:InvoiceLine");

	line.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(item.id);
	line
		.ele(UBL_NAMESPACES.cbc, "cbc:InvoicedQuantity")
		.att("unitCode", "PCE")
		.txt(String(item.quantity));
	line
		.ele(UBL_NAMESPACES.cbc, "cbc:LineExtensionAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(item.lineTotal));

	// Line-level discount
	if (item.discount && item.discount > 0) {
		const ac = line.ele(UBL_NAMESPACES.cac, "cac:AllowanceCharge");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:ChargeIndicator").txt("false");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceChargeReason").txt("discount");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:Amount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(item.discount));
	}

	// TaxTotal per line
	const taxAmount = item.lineTotal * (item.taxPercent / 100);
	const lineTax = line.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	lineTax
		.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(taxAmount));
	lineTax
		.ele(UBL_NAMESPACES.cbc, "cbc:RoundingAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(item.lineTotal + taxAmount));

	// Item
	const itemEle = line.ele(UBL_NAMESPACES.cac, "cac:Item");
	itemEle.ele(UBL_NAMESPACES.cbc, "cbc:Name").txt(item.name);

	const classifiedTax = itemEle.ele(UBL_NAMESPACES.cac, "cac:ClassifiedTaxCategory");
	classifiedTax.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(item.taxCategory);
	classifiedTax.ele(UBL_NAMESPACES.cbc, "cbc:Percent").txt(String(item.taxPercent));
	const taxScheme = classifiedTax.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
	taxScheme.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);

	// Price
	const price = line.ele(UBL_NAMESPACES.cac, "cac:Price");
	price
		.ele(UBL_NAMESPACES.cbc, "cbc:PriceAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(item.unitPrice));
}

// ─── Utility functions ──────────────────────────────────────────────────

function formatAmount(amount: number): string {
	return amount.toFixed(2);
}

function groupByTaxCategory(items: ZatcaLineItem[]): Record<string, ZatcaLineItem[]> {
	const groups: Record<string, ZatcaLineItem[]> = {};
	for (const item of items) {
		const key = item.taxCategory;
		if (!groups[key]) groups[key] = [];
		groups[key].push(item);
	}
	return groups;
}

function aggregateTaxPercent(items: ZatcaLineItem[]): number {
	// Return the most common tax percent (typically 15 for Saudi)
	const percents = items.map((i) => i.taxPercent);
	return percents[0] ?? 15;
}
