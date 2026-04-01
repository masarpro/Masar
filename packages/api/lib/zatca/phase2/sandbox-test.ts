/**
 * ZATCA Phase 2 — Sandbox E2E Test
 *
 * Uses zatca-xml-js library for invoice building and signing (proven to work with ZATCA).
 * Uses our CSR generator (OpenSSL-based) for key/CSR generation.
 * Uses our API client for ZATCA API communication.
 *
 * Usage: npx tsx packages/api/lib/zatca/phase2/sandbox-test.ts
 */

import { generateCSRviaOpenSSL } from "./csr-generator";
import {
	requestComplianceCSID,
	submitComplianceInvoice,
	requestProductionCSID,
	reportInvoice,
	clearInvoice,
} from "./api-client";
import {
	ZATCASimplifiedTaxInvoice,
	ZATCAInvoiceTypes,
	ZATCAPaymentMethods,
} from "zatca-xml-js";
import { generateSignedXMLString } from "zatca-xml-js/lib/zatca/signing";
import { XMLDocument } from "zatca-xml-js/lib/parser";
import type { EGSUnitInfo } from "zatca-xml-js/lib/zatca/egs";
import type { ZATCASimplifiedInvoiceLineItem } from "zatca-xml-js";

// ─── Test Configuration ────────────────────────────────────────────────

const TEST_VAT = process.env.ZATCA_VAT || "399999999900003";
const TEST_OTP = process.env.ZATCA_OTP || "123345";
const TEST_ORG = "Maximum Speed Tech Supply LTD";
const TEST_BRANCH = "Riyadh Branch";
const TEST_INDUSTRY = "Supply";
const TEST_ADDRESS = "RRRD2929";

const INITIAL_PIH = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";

interface StepResult {
	step: number;
	name: string;
	ok: boolean;
	details?: string;
	errors?: unknown[];
	warnings?: unknown[];
}

// ─── EGS Unit Info (used by zatca-xml-js) ──────────────────────────────

function makeEGSInfo(): EGSUnitInfo {
	return {
		uuid: crypto.randomUUID(),
		custom_id: "EGS1-886431145",
		model: "IOS",
		CRN_number: "454634645645654",
		VAT_name: TEST_ORG,
		VAT_number: TEST_VAT,
		branch_name: TEST_BRANCH,
		branch_industry: TEST_INDUSTRY,
		location: {
			city: "Riyadh",
			city_subdivision: "West",
			street: "Prince Sultan St",
			plot_identification: "0000",
			building: "2322",
			postal_zone: "23333",
		},
	};
}

// ─── Main test runner ──────────────────────────────────────────────────

export async function runSandboxE2ETest(): Promise<StepResult[]> {
	const results: StepResult[] = [];

	console.log("╔══════════════════════════════════════════════════════════╗");
	console.log("║  ZATCA Phase 2 — Sandbox E2E Test (zatca-xml-js)       ║");
	console.log("╚══════════════════════════════════════════════════════════╝\n");

	// ═══ Step 1: CSR Generation ═══
	console.log("─── Step 1: CSR Generation ───");
	let csrResult: Awaited<ReturnType<typeof generateCSRviaOpenSSL>>;
	try {
		csrResult = await generateCSRviaOpenSSL({
			organizationName: TEST_ORG,
			vatNumber: TEST_VAT,
			invoiceType: "1100",
			location: TEST_ADDRESS,
			industry: TEST_INDUSTRY,
		});
		results.push({ step: 1, name: "CSR Generation", ok: true, details: `len: ${csrResult.csr.length}` });
		console.log(`✅ Step 1: CSR generated (${csrResult.csr.length} chars)\n`);
	} catch (error) {
		results.push({ step: 1, name: "CSR Generation", ok: false, errors: [error] });
		console.error(`❌ Step 1 failed:`, error);
		return results;
	}

	// ═══ Step 2: Compliance CSID ═══
	console.log("─── Step 2: POST /compliance → CCSID ───");
	const complianceResult = await requestComplianceCSID(csrResult.csr, TEST_OTP);
	results.push({
		step: 2, name: "Compliance CSID", ok: complianceResult.success,
		details: complianceResult.success ? `requestId: ${complianceResult.requestId}` : undefined,
		errors: complianceResult.errors,
	});
	if (!complianceResult.success) {
		console.error(`❌ Step 2 failed:`, complianceResult.errors);
		return results;
	}
	console.log(`✅ Step 2: CCSID obtained (requestId: ${complianceResult.requestId})\n`);

	// Decode binarySecurityToken → PEM body (certificate base64)
	const certPemBody = Buffer.from(complianceResult.csid!, "base64").toString("utf-8");
	console.log("[DEBUG] cert PEM body first 50:", certPemBody.substring(0, 50));

	// Private key — our OpenSSL generator returns SEC1 or PKCS8 PEM
	const privateKeyBody = csrResult.privateKey
		.replace(/-----BEGIN[^-]+-----/g, "")
		.replace(/-----END[^-]+-----/g, "")
		.replace(/\s/g, "");

	// ═══ Steps 3-8: Compliance Invoices (3 simplified + 3 standard) ═══
	const egsInfo = makeEGSInfo();
	const lineItem: ZATCASimplifiedInvoiceLineItem = {
		id: "1",
		name: "Test Item",
		quantity: 5,
		tax_exclusive_price: 10,
		VAT_percent: 0.15,
	};

	const complianceTests: Array<{
		label: string;
		standard: boolean;
		cancelation?: { canceled_invoice_number: number; payment_method: ZATCAPaymentMethods; cancelation_type: ZATCAInvoiceTypes; reason: string };
	}> = [
		// Simplified (B2C)
		{ label: "Simplified Invoice", standard: false },
		{ label: "Simplified Debit", standard: false, cancelation: { canceled_invoice_number: 1, payment_method: ZATCAPaymentMethods.CASH, cancelation_type: ZATCAInvoiceTypes.DEBIT_NOTE, reason: "Service upgrade" } },
		{ label: "Simplified Credit", standard: false, cancelation: { canceled_invoice_number: 1, payment_method: ZATCAPaymentMethods.CASH, cancelation_type: ZATCAInvoiceTypes.CREDIT_NOTE, reason: "Return" } },
		// Standard (B2B)
		{ label: "Standard Invoice", standard: true },
		{ label: "Standard Debit", standard: true, cancelation: { canceled_invoice_number: 4, payment_method: ZATCAPaymentMethods.CASH, cancelation_type: ZATCAInvoiceTypes.DEBIT_NOTE, reason: "Service upgrade" } },
		{ label: "Standard Credit", standard: true, cancelation: { canceled_invoice_number: 4, payment_method: ZATCAPaymentMethods.CASH, cancelation_type: ZATCAInvoiceTypes.CREDIT_NOTE, reason: "Return" } },
	];

	let previousHash = INITIAL_PIH;
	let counter = 0;
	const issueDate = new Date().toISOString().split("T")[0]!;
	const issueTime = new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, "");

	for (const test of complianceTests) {
		counter++;
		const stepNum = 2 + counter;
		console.log(`─── Step ${stepNum}: Compliance ${test.label} ───`);

		// Build simplified invoice first (zatca-xml-js only builds simplified)
		const invoice = new ZATCASimplifiedTaxInvoice({
			props: {
				egs_info: egsInfo,
				invoice_counter_number: counter,
				invoice_serial_number: `EGS1-886431145-${counter}`,
				issue_date: issueDate,
				issue_time: issueTime,
				previous_invoice_hash: previousHash,
				line_items: [lineItem],
				cancelation: test.cancelation,
			},
		});

		let signedResult: { signed_invoice_string: string; invoice_hash: string; qr: string };

		if (test.standard) {
			// Convert simplified → standard:
			// 1. Change InvoiceTypeCode name 02→01
			// 2. Replace empty AccountingCustomerParty with full buyer
			// 3. Add Delivery with ActualDeliveryDate
			const xmlDoc = invoice.getXML();
			let xmlStr = xmlDoc.toString({ no_header: false });

			xmlStr = xmlStr.replace(/name="02/g, 'name="01');

			// Replace the empty AccountingCustomerParty with full buyer info
			const buyerBlock = [
				`<cac:AccountingCustomerParty>`,
				`<cac:Party>`,
				`<cac:PartyIdentification><cbc:ID schemeID="CRN">454634645645654</cbc:ID></cac:PartyIdentification>`,
				`<cac:PostalAddress>`,
				`<cbc:StreetName>King Fahd St</cbc:StreetName>`,
				`<cbc:BuildingNumber>1234</cbc:BuildingNumber>`,
				`<cbc:CitySubdivisionName>West</cbc:CitySubdivisionName>`,
				`<cbc:CityName>Jeddah</cbc:CityName>`,
				`<cbc:PostalZone>23456</cbc:PostalZone>`,
				`<cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>`,
				`</cac:PostalAddress>`,
				`<cac:PartyTaxScheme>`,
				`<cbc:CompanyID>300000000000003</cbc:CompanyID>`,
				`<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>`,
				`</cac:PartyTaxScheme>`,
				`<cac:PartyLegalEntity><cbc:RegistrationName>Test Buyer Corp</cbc:RegistrationName></cac:PartyLegalEntity>`,
				`</cac:Party>`,
				`</cac:AccountingCustomerParty>`,
			].join("");

			// Replace empty tag (may be self-closing or open+close)
			xmlStr = xmlStr
				.replace(/<cac:AccountingCustomerParty\s*\/>/, buyerBlock)
				.replace(/<cac:AccountingCustomerParty><\/cac:AccountingCustomerParty>/, buyerBlock);

			// Add Delivery — must come before PaymentMeans (if present) or TaxTotal
			const deliveryBlock = `<cac:Delivery><cbc:ActualDeliveryDate>${issueDate}</cbc:ActualDeliveryDate></cac:Delivery>`;
			if (xmlStr.includes("<cac:PaymentMeans>")) {
				xmlStr = xmlStr.replace("<cac:PaymentMeans>", `${deliveryBlock}<cac:PaymentMeans>`);
			} else {
				xmlStr = xmlStr.replace("<cac:TaxTotal>", `${deliveryBlock}<cac:TaxTotal>`);
			}

			const modifiedDoc = new XMLDocument(xmlStr);
			signedResult = generateSignedXMLString({
				invoice_xml: modifiedDoc,
				certificate_string: certPemBody,
				private_key_string: privateKeyBody,
			});
		} else {
			signedResult = invoice.sign(certPemBody, privateKeyBody);
		}

		previousHash = signedResult.invoice_hash;
		const signedB64 = Buffer.from(signedResult.signed_invoice_string).toString("base64");

		const result = await submitComplianceInvoice(
			signedB64, signedResult.invoice_hash, egsInfo.uuid,
			complianceResult.csid!, complianceResult.secret!,
		);

		results.push({
			step: stepNum, name: `Compliance ${test.label}`, ok: result.success,
			errors: result.errors, warnings: result.warnings,
		});

		if (result.success) {
			console.log(`✅ Step ${stepNum}: ${test.label} passed`);
			if (result.warnings?.length) console.log(`   ⚠️`, result.warnings);
		} else {
			console.error(`❌ Step ${stepNum}: ${test.label} failed:`, result.errors);
		}
		console.log();
	}

	const complianceFailed = results.some(r => r.step >= 3 && r.step <= 8 && !r.ok);
	if (complianceFailed) {
		console.error("⛔ Compliance failed — cannot proceed\n");
		return results;
	}

	// ═══ Step 9: Production CSID ═══
	console.log("─── Step 9: POST /production/csids → PCSID ───");
	const prodResult = await requestProductionCSID(
		complianceResult.requestId!, complianceResult.csid!, complianceResult.secret!,
	);
	results.push({
		step: 9, name: "Production CSID", ok: prodResult.success,
		details: prodResult.success ? `requestId: ${prodResult.requestId}` : undefined,
		errors: prodResult.errors,
	});
	if (!prodResult.success) {
		console.error(`❌ Step 9 failed:`, prodResult.errors);
		return results;
	}
	console.log(`✅ Step 9: PCSID obtained\n`);

	const prodCertBody = Buffer.from(prodResult.csid!, "base64").toString("utf-8");

	// ═══ Step 10: Reporting (simplified B2C) ═══
	console.log("─── Step 10: POST /invoices/reporting/single ───");
	counter++;
	const reportInv = new ZATCASimplifiedTaxInvoice({
		props: {
			egs_info: egsInfo,
			invoice_counter_number: counter,
			invoice_serial_number: `EGS1-886431145-${counter}`,
			issue_date: new Date().toISOString().split("T")[0]!,
			issue_time: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
			previous_invoice_hash: previousHash,
			line_items: [lineItem],
		},
	});
	const reportSigned = reportInv.sign(prodCertBody, privateKeyBody);
	previousHash = reportSigned.invoice_hash;

	const reportRes = await reportInvoice(
		Buffer.from(reportSigned.signed_invoice_string).toString("base64"),
		reportSigned.invoice_hash, egsInfo.uuid,
		prodResult.csid!, prodResult.secret!,
	);
	results.push({
		step: 10, name: "Reporting (B2C)", ok: reportRes.success,
		details: `status: ${reportRes.status}`,
		errors: reportRes.errors, warnings: reportRes.warnings,
	});
	if (reportRes.success) {
		console.log(`✅ Step 10: Reported (${reportRes.status})`);
	} else {
		console.error(`❌ Step 10 failed:`, reportRes.errors);
	}
	console.log();

	// ═══ Summary ═══
	console.log("╔══════════════════════════════════════════════════════════╗");
	console.log("║                    Test Summary                         ║");
	console.log("╠══════════════════════════════════════════════════════════╣");
	for (const r of results) {
		const icon = r.ok ? "✅" : "❌";
		console.log(`║ ${icon} Step ${r.step}: ${r.name.padEnd(30)} ${(r.details || "").padEnd(20)}║`);
	}
	const passed = results.filter(r => r.ok).length;
	console.log("╠══════════════════════════════════════════════════════════╣");
	console.log(`║ Result: ${passed}/${results.length} passed`.padEnd(58) + "║");
	console.log("╚══════════════════════════════════════════════════════════╝");

	return results;
}

// ─── CLI entry point ───────────────────────────────────────────────────

const isDirectRun = typeof require !== "undefined" && require.main === module;

if (isDirectRun) {
	if (!process.env.ZATCA_ENVIRONMENT) {
		process.env.ZATCA_ENVIRONMENT = "simulation";
	}
	runSandboxE2ETest()
		.then((results) => {
			process.exit(results.every(r => r.ok) ? 0 : 1);
		})
		.catch((err) => {
			console.error("Fatal:", err);
			process.exit(1);
		});
}
