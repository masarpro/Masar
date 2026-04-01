/**
 * ZATCA Phase 2 — UBL 2.1 XML Builder
 *
 * Builds a complete UBL 2.1 Invoice XML document per ZATCA XML Implementation
 * Standards v2. Element ordering is strict per UBL 2.1 XSD sequence.
 *
 * UBL 2.1 Invoice element order:
 *  1  cbc:ProfileID
 *  2  cbc:ID
 *  3  cbc:UUID
 *  4  cbc:IssueDate
 *  5  cbc:IssueTime
 *  6  cbc:InvoiceTypeCode
 *  7  cbc:Note
 *  8  cbc:DocumentCurrencyCode
 *  9  cbc:TaxCurrencyCode
 * 10  cac:BillingReference
 * 11  cac:AdditionalDocumentReference (ICV, PIH, QR)
 * 12  cac:Signature
 * 13  cac:AccountingSupplierParty
 * 14  cac:AccountingCustomerParty
 * 15  cac:Delivery
 * 16  cac:PaymentMeans
 * 17  cac:AllowanceCharge
 * 18  cac:TaxTotal (×2)
 * 19  cac:LegalMonetaryTotal
 * 20  cac:InvoiceLine
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

export function buildInvoiceXml(data: ZatcaInvoiceData): string {
	const doc = create({ version: "1.0", encoding: "UTF-8" });

	const inv = doc
		.ele(UBL_NAMESPACES.invoice, "Invoice")
		.att("xmlns:cac", UBL_NAMESPACES.cac)
		.att("xmlns:cbc", UBL_NAMESPACES.cbc)
		.att("xmlns:ext", UBL_NAMESPACES.ext);

	// ── 1. cbc:ProfileID ────────────────────────────────────────────
	inv.ele(UBL_NAMESPACES.cbc, "cbc:ProfileID").txt(UBL_PROFILE_ID);

	// ── 2. cbc:ID ───────────────────────────────────────────────────
	inv.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(data.invoiceNumber);

	// ── 3. cbc:UUID ─────────────────────────────────────────────────
	inv.ele(UBL_NAMESPACES.cbc, "cbc:UUID").txt(data.uuid);

	// ── 4. cbc:IssueDate + cbc:IssueTime ────────────────────────────
	inv.ele(UBL_NAMESPACES.cbc, "cbc:IssueDate").txt(data.issueDate);
	inv.ele(UBL_NAMESPACES.cbc, "cbc:IssueTime").txt(data.issueTime);

	// ── 5. cbc:InvoiceTypeCode ──────────────────────────────────────
	const subtype = data.isSimplified ? INVOICE_SUBTYPE.SIMPLIFIED : INVOICE_SUBTYPE.STANDARD;
	inv
		.ele(UBL_NAMESPACES.cbc, "cbc:InvoiceTypeCode")
		.att("name", subtype)
		.txt(data.invoiceTypeCode);

	// ── 6. cbc:Note (credit/debit note reason — BR-KSA-17) ─────────
	const noteReason = (data as any).noteReason as string | undefined;
	if (noteReason) {
		inv.ele(UBL_NAMESPACES.cbc, "cbc:Note").txt(noteReason);
	}

	// ── 7. cbc:DocumentCurrencyCode + cbc:TaxCurrencyCode ───────────
	inv.ele(UBL_NAMESPACES.cbc, "cbc:DocumentCurrencyCode").txt(DEFAULT_CURRENCY);
	inv.ele(UBL_NAMESPACES.cbc, "cbc:TaxCurrencyCode").txt(DEFAULT_CURRENCY);

	// ── 8. cac:BillingReference (credit/debit notes only) ───────────
	if (data.billingReference) {
		const br = inv.ele(UBL_NAMESPACES.cac, "cac:BillingReference");
		const ref = br.ele(UBL_NAMESPACES.cac, "cac:InvoiceDocumentReference");
		ref.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(data.billingReference.invoiceNumber);
		if (data.billingReference.invoiceUuid) {
			ref.ele(UBL_NAMESPACES.cbc, "cbc:UUID").txt(data.billingReference.invoiceUuid);
		}
	}

	// ── 9. cac:AdditionalDocumentReference — ICV ────────────────────
	addAdditionalDocRef(inv, "ICV", String(data.invoiceCounter));

	// ── 10. cac:AdditionalDocumentReference — PIH ───────────────────
	addPIHDocRef(inv, data.previousInvoiceHash);

	// ── 11. cac:AdditionalDocumentReference — QR (injected by signer)

	// ── 12. cac:Signature ───────────────────────────────────────────
	const sigRef = inv.ele(UBL_NAMESPACES.cac, "cac:Signature");
	sigRef.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt("urn:oasis:names:specification:ubl:signature:Invoice");
	sigRef.ele(UBL_NAMESPACES.cbc, "cbc:SignatureMethod").txt("urn:oasis:names:specification:ubl:dsig:enveloped:xades");

	// ── 13. cac:AccountingSupplierParty ──────────────────────────────
	addSupplierParty(inv, data.seller);

	// ── 14. cac:AccountingCustomerParty (always required by ZATCA) ──
	if (data.buyer) {
		addCustomerParty(inv, data.buyer);
	} else {
		// Minimal buyer for simplified invoices
		const cp = inv.ele(UBL_NAMESPACES.cac, "cac:AccountingCustomerParty");
		const party = cp.ele(UBL_NAMESPACES.cac, "cac:Party");
		const ple = party.ele(UBL_NAMESPACES.cac, "cac:PartyLegalEntity");
		ple.ele(UBL_NAMESPACES.cbc, "cbc:RegistrationName").txt("\u200B");
	}

	// ── 15. cac:Delivery (always — use issueDate as fallback) ──────
	{
		const delivery = inv.ele(UBL_NAMESPACES.cac, "cac:Delivery");
		delivery
			.ele(UBL_NAMESPACES.cbc, "cbc:ActualDeliveryDate")
			.txt(data.deliveryDate || data.issueDate);
	}

	// ── 16. cac:PaymentMeans (always) ──────────────────────────────
	{
		const pm = inv.ele(UBL_NAMESPACES.cac, "cac:PaymentMeans");
		pm.ele(UBL_NAMESPACES.cbc, "cbc:PaymentMeansCode").txt(data.paymentMeansCode || "10");
		if (noteReason && (data.invoiceTypeCode === "381" || data.invoiceTypeCode === "383")) {
			pm.ele(UBL_NAMESPACES.cbc, "cbc:InstructionNote").txt(noteReason);
		}
	}

	// ── 17. cac:AllowanceCharge (invoice-level discount) ────────────
	if (data.totals.totalDiscount > 0) {
		const ac = inv.ele(UBL_NAMESPACES.cac, "cac:AllowanceCharge");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:ChargeIndicator").txt("false");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceChargeReason").txt("discount");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:Amount")
			.att("currencyID", DEFAULT_CURRENCY)
			.txt(formatAmount(data.totals.totalDiscount));
		const taxCat = ac.ele(UBL_NAMESPACES.cac, "cac:TaxCategory");
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt("S");
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:Percent").txt(formatAmount(aggregateTaxPercent(data.lineItems)));
		const taxScheme = taxCat.ele(UBL_NAMESPACES.cac, "cac:TaxScheme");
		taxScheme.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}

	// ── 18. cac:TaxTotal (document currency) ────────────────────────
	addTaxTotal(inv, data);

	// ── 18b. cac:TaxTotal (tax currency — same as SAR for Saudi) ────
	const taxTotal2 = inv.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	taxTotal2
		.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount")
		.att("currencyID", DEFAULT_CURRENCY)
		.txt(formatAmount(data.totals.taxAmount));

	// ── 19. cac:LegalMonetaryTotal ──────────────────────────────────
	addLegalMonetaryTotal(inv, data.totals);

	// ── 20. cac:InvoiceLine ─────────────────────────────────────────
	for (const item of data.lineItems) {
		addInvoiceLine(inv, item);
	}

	return doc.end({ prettyPrint: false });
}

// ─── Helpers ───────────────────────────────────────────────────────────

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

function addSupplierParty(parent: ReturnType<typeof create>, seller: ZatcaInvoiceData["seller"]): void {
	const sp = parent.ele(UBL_NAMESPACES.cac, "cac:AccountingSupplierParty");
	const party = sp.ele(UBL_NAMESPACES.cac, "cac:Party");

	if (seller.crNumber) {
		const pid = party.ele(UBL_NAMESPACES.cac, "cac:PartyIdentification");
		pid.ele(UBL_NAMESPACES.cbc, "cbc:ID").att("schemeID", "CRN").txt(seller.crNumber);
	}

	addAddress(party, seller.address);

	const pts = party.ele(UBL_NAMESPACES.cac, "cac:PartyTaxScheme");
	pts.ele(UBL_NAMESPACES.cbc, "cbc:CompanyID").txt(seller.taxNumber);
	pts.ele(UBL_NAMESPACES.cac, "cac:TaxScheme").ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);

	const ple = party.ele(UBL_NAMESPACES.cac, "cac:PartyLegalEntity");
	ple.ele(UBL_NAMESPACES.cbc, "cbc:RegistrationName").txt(seller.name);
}

function addCustomerParty(parent: ReturnType<typeof create>, buyer: NonNullable<ZatcaInvoiceData["buyer"]>): void {
	const cp = parent.ele(UBL_NAMESPACES.cac, "cac:AccountingCustomerParty");
	const party = cp.ele(UBL_NAMESPACES.cac, "cac:Party");

	if (buyer.identificationId && buyer.identificationScheme) {
		const pid = party.ele(UBL_NAMESPACES.cac, "cac:PartyIdentification");
		pid.ele(UBL_NAMESPACES.cbc, "cbc:ID").att("schemeID", buyer.identificationScheme).txt(buyer.identificationId);
	}

	if (buyer.address) {
		addAddress(party, {
			city: buyer.address.city ?? "",
			countryCode: buyer.address.countryCode ?? "SA",
			street: buyer.address.street,
			buildingNumber: buyer.address.buildingNumber,
			district: buyer.address.district,
			postalCode: buyer.address.postalCode,
		});
	}

	if (buyer.taxNumber) {
		const pts = party.ele(UBL_NAMESPACES.cac, "cac:PartyTaxScheme");
		pts.ele(UBL_NAMESPACES.cbc, "cbc:CompanyID").txt(buyer.taxNumber);
		pts.ele(UBL_NAMESPACES.cac, "cac:TaxScheme").ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}

	const ple = party.ele(UBL_NAMESPACES.cac, "cac:PartyLegalEntity");
	ple.ele(UBL_NAMESPACES.cbc, "cbc:RegistrationName").txt(buyer.name);
}

function addAddress(parent: ReturnType<typeof create>, addr: ZatcaAddress): void {
	const pa = parent.ele(UBL_NAMESPACES.cac, "cac:PostalAddress");
	if (addr.street) pa.ele(UBL_NAMESPACES.cbc, "cbc:StreetName").txt(addr.street);
	if (addr.buildingNumber) pa.ele(UBL_NAMESPACES.cbc, "cbc:BuildingNumber").txt(addr.buildingNumber);
	if (addr.additionalNumber) pa.ele(UBL_NAMESPACES.cbc, "cbc:PlotIdentification").txt(addr.additionalNumber);
	if (addr.district) pa.ele(UBL_NAMESPACES.cbc, "cbc:CitySubdivisionName").txt(addr.district);
	if (addr.city) pa.ele(UBL_NAMESPACES.cbc, "cbc:CityName").txt(addr.city);
	if (addr.postalCode) pa.ele(UBL_NAMESPACES.cbc, "cbc:PostalZone").txt(addr.postalCode);
	pa.ele(UBL_NAMESPACES.cac, "cac:Country").ele(UBL_NAMESPACES.cbc, "cbc:IdentificationCode").txt(addr.countryCode);
}

function addTaxTotal(parent: ReturnType<typeof create>, data: ZatcaInvoiceData): void {
	const tt = parent.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	tt.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(data.totals.taxAmount));

	const groups = groupByTaxCategory(data.lineItems);
	for (const [category, items] of Object.entries(groups)) {
		const subtotal = tt.ele(UBL_NAMESPACES.cac, "cac:TaxSubtotal");
		const taxableSum = items.reduce((sum, it) => sum + it.lineTotal, 0);
		const taxSum = items.reduce((sum, it) => sum + it.lineTotal * (it.taxPercent / 100), 0);

		subtotal.ele(UBL_NAMESPACES.cbc, "cbc:TaxableAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(taxableSum));
		subtotal.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(taxSum));

		const taxCat = subtotal.ele(UBL_NAMESPACES.cac, "cac:TaxCategory");
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(category);
		taxCat.ele(UBL_NAMESPACES.cbc, "cbc:Percent").txt(String(items[0]!.taxPercent));
		taxCat.ele(UBL_NAMESPACES.cac, "cac:TaxScheme").ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);
	}
}

function addLegalMonetaryTotal(parent: ReturnType<typeof create>, totals: ZatcaInvoiceData["totals"]): void {
	const lmt = parent.ele(UBL_NAMESPACES.cac, "cac:LegalMonetaryTotal");
	lmt.ele(UBL_NAMESPACES.cbc, "cbc:LineExtensionAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.subtotal));
	lmt.ele(UBL_NAMESPACES.cbc, "cbc:TaxExclusiveAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.taxableAmount));
	lmt.ele(UBL_NAMESPACES.cbc, "cbc:TaxInclusiveAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.totalWithVat));
	if (totals.totalDiscount > 0) {
		lmt.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceTotalAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.totalDiscount));
	}
	if (totals.prepaidAmount && totals.prepaidAmount > 0) {
		lmt.ele(UBL_NAMESPACES.cbc, "cbc:PrepaidAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.prepaidAmount));
	}
	lmt.ele(UBL_NAMESPACES.cbc, "cbc:PayableAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(totals.payableAmount));
}

function addInvoiceLine(parent: ReturnType<typeof create>, item: ZatcaLineItem): void {
	const line = parent.ele(UBL_NAMESPACES.cac, "cac:InvoiceLine");
	line.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(item.id);
	line.ele(UBL_NAMESPACES.cbc, "cbc:InvoicedQuantity").att("unitCode", "PCE").txt(String(item.quantity));
	line.ele(UBL_NAMESPACES.cbc, "cbc:LineExtensionAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(item.lineTotal));

	if (item.discount && item.discount > 0) {
		const ac = line.ele(UBL_NAMESPACES.cac, "cac:AllowanceCharge");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:ChargeIndicator").txt("false");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:AllowanceChargeReason").txt("discount");
		ac.ele(UBL_NAMESPACES.cbc, "cbc:Amount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(item.discount));
	}

	const taxAmount = item.lineTotal * (item.taxPercent / 100);
	const lineTax = line.ele(UBL_NAMESPACES.cac, "cac:TaxTotal");
	lineTax.ele(UBL_NAMESPACES.cbc, "cbc:TaxAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(taxAmount));
	lineTax.ele(UBL_NAMESPACES.cbc, "cbc:RoundingAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(item.lineTotal + taxAmount));

	const itemEle = line.ele(UBL_NAMESPACES.cac, "cac:Item");
	itemEle.ele(UBL_NAMESPACES.cbc, "cbc:Name").txt(item.name);
	const classifiedTax = itemEle.ele(UBL_NAMESPACES.cac, "cac:ClassifiedTaxCategory");
	classifiedTax.ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(item.taxCategory);
	classifiedTax.ele(UBL_NAMESPACES.cbc, "cbc:Percent").txt(String(item.taxPercent));
	classifiedTax.ele(UBL_NAMESPACES.cac, "cac:TaxScheme").ele(UBL_NAMESPACES.cbc, "cbc:ID").txt(TAX_SCHEME_ID);

	const price = line.ele(UBL_NAMESPACES.cac, "cac:Price");
	price.ele(UBL_NAMESPACES.cbc, "cbc:PriceAmount").att("currencyID", DEFAULT_CURRENCY).txt(formatAmount(item.unitPrice));
}

// ─── Utility ───────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
	return amount.toFixed(2);
}

function groupByTaxCategory(items: ZatcaLineItem[]): Record<string, ZatcaLineItem[]> {
	const groups: Record<string, ZatcaLineItem[]> = {};
	for (const item of items) {
		if (!groups[item.taxCategory]) groups[item.taxCategory] = [];
		groups[item.taxCategory].push(item);
	}
	return groups;
}

function aggregateTaxPercent(items: ZatcaLineItem[]): number {
	return items[0]?.taxPercent ?? 15;
}
