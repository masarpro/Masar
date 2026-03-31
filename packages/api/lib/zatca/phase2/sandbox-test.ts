/**
 * ZATCA Phase 2 — Full Sandbox E2E Test
 *
 * Tests the complete onboarding + submission flow against the ZATCA sandbox:
 *   1. CSR Generation
 *   2. POST /compliance → CCSID
 *   3. POST /compliance/invoices × 3 types (invoice + credit + debit)
 *   4. POST /production/csids → PCSID
 *   5. POST /invoices/reporting/single (simplified)
 *   6. POST /invoices/clearance/single (standard)
 *
 * Usage: npx tsx packages/api/lib/zatca/phase2/sandbox-test.ts
 *
 * Required env: ZATCA_ENVIRONMENT=sandbox (or unset, defaults to sandbox)
 */

import { generateCSR } from "./csr-generator";
import { buildInvoiceXml } from "./xml-builder";
import { signInvoice } from "./invoice-signer";
import { getInitialPIH } from "./hash-chain";
import {
	requestComplianceCSID,
	submitComplianceInvoice,
	requestProductionCSID,
	reportInvoice,
	clearInvoice,
} from "./api-client";
import { SANDBOX_DEFAULTS } from "./constants";
import type { ZatcaInvoiceData } from "./types";

// ─── Test Configuration ────────────────────────────────────────────────

const TEST_VAT = "399999999900003"; // ZATCA sandbox test VAT number
const TEST_ORG = "Maximum Speed Tech Supply LTD";
const TEST_BRANCH = "Riyadh Branch";
const TEST_INDUSTRY = "Supply activities";
const TEST_ADDRESS = "RRRD2929";

interface StepResult {
	step: number;
	name: string;
	ok: boolean;
	details?: string;
	errors?: unknown[];
	warnings?: unknown[];
}

// ─── Main test runner ──────────────────────────────────────────────────

export async function runSandboxE2ETest(): Promise<StepResult[]> {
	const results: StepResult[] = [];

	console.log("╔══════════════════════════════════════════════════════════╗");
	console.log("║        ZATCA Phase 2 — Sandbox E2E Test                ║");
	console.log("╚══════════════════════════════════════════════════════════╝\n");

	// ════════════════════════════════════════════════════════════════════
	// Step 1: CSR Generation
	// ════════════════════════════════════════════════════════════════════
	console.log("─── Step 1: CSR Generation ───");
	let csrResult: Awaited<ReturnType<typeof generateCSR>>;
	try {
		csrResult = await generateCSR({
			organizationName: TEST_ORG,
			vatNumber: TEST_VAT,
			invoiceType: "1100",
			location: TEST_ADDRESS,
			industry: TEST_INDUSTRY,
		});
		results.push({
			step: 1,
			name: "CSR Generation",
			ok: true,
			details: `CSR length: ${csrResult.csr.length}`,
		});
		console.log(`✅ Step 1: CSR generated (${csrResult.csr.length} chars)\n`);
	} catch (error) {
		results.push({ step: 1, name: "CSR Generation", ok: false, errors: [error] });
		console.error(`❌ Step 1: CSR generation failed:`, error);
		return results; // Can't proceed
	}

	// ════════════════════════════════════════════════════════════════════
	// Step 2: Compliance CSID
	// ════════════════════════════════════════════════════════════════════
	console.log("─── Step 2: POST /compliance → CCSID ───");
	const complianceResult = await requestComplianceCSID(csrResult.csr, SANDBOX_DEFAULTS.otp);
	results.push({
		step: 2,
		name: "Compliance CSID",
		ok: complianceResult.success,
		details: complianceResult.success
			? `requestId: ${complianceResult.requestId}`
			: undefined,
		errors: complianceResult.errors,
	});
	if (complianceResult.success) {
		console.log(`✅ Step 2: CCSID obtained (requestId: ${complianceResult.requestId})\n`);
	} else {
		console.error(`❌ Step 2: Compliance CSID failed:`, complianceResult.errors);
		return results;
	}

	// ════════════════════════════════════════════════════════════════════
	// Step 3: Compliance Invoices (3 types)
	// ════════════════════════════════════════════════════════════════════
	const complianceTypes: Array<{
		typeCode: "388" | "381" | "383";
		label: string;
		billingRef?: { invoiceNumber: string };
	}> = [
		{ typeCode: "388", label: "Invoice" },
		{ typeCode: "383", label: "Debit Note", billingRef: { invoiceNumber: "TEST-0001" } },
		{ typeCode: "381", label: "Credit Note", billingRef: { invoiceNumber: "TEST-0001" } },
	];

	let previousHash = getInitialPIH();
	let counter = 0;

	for (const testType of complianceTypes) {
		counter++;
		const stepNum = 2 + counter; // 3, 4, 5
		const uuid = crypto.randomUUID();
		console.log(`─── Step ${stepNum}: Compliance ${testType.label} ───`);

		const invoiceData: ZatcaInvoiceData = {
			uuid,
			invoiceNumber: `TEST-${String(counter).padStart(4, "0")}`,
			issueDate: new Date().toISOString().split("T")[0]!,
			issueTime: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
			invoiceTypeCode: testType.typeCode,
			isSimplified: true, // Simplified for compliance test
			seller: {
				name: TEST_ORG,
				taxNumber: TEST_VAT,
				address: {
					street: "Test Street",
					buildingNumber: "1234",
					city: "Riyadh",
					postalCode: "12345",
					district: "Test District",
					countryCode: "SA",
				},
			},
			lineItems: [
				{
					id: "1",
					name: "Test Item",
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
			billingReference: testType.billingRef,
			previousInvoiceHash: previousHash,
			invoiceCounter: counter,
		};

		const xml = buildInvoiceXml(invoiceData);
		const signed = signInvoice(
			xml,
			csrResult.privateKey,
			complianceResult.csid!,
			csrResult.publicKey,
		);
		previousHash = signed.invoiceHash;

		const result = await submitComplianceInvoice(
			Buffer.from(signed.signedXml).toString("base64"),
			signed.invoiceHash,
			uuid,
			complianceResult.csid!,
			complianceResult.secret!,
		);

		results.push({
			step: stepNum,
			name: `Compliance ${testType.label}`,
			ok: result.success,
			errors: result.errors,
			warnings: result.warnings,
		});

		if (result.success) {
			console.log(`✅ Step ${stepNum}: ${testType.label} passed`);
			if (result.warnings?.length) {
				console.log(`   ⚠️ Warnings:`, result.warnings);
			}
		} else {
			console.error(`❌ Step ${stepNum}: ${testType.label} failed:`, result.errors);
		}
		console.log();
	}

	// Check if all compliance tests passed
	const complianceFailed = results.some((r) => r.step >= 3 && r.step <= 5 && !r.ok);
	if (complianceFailed) {
		console.error("⛔ Compliance tests failed — cannot proceed to production CSID\n");
		return results;
	}

	// ════════════════════════════════════════════════════════════════════
	// Step 6: Production CSID
	// ════════════════════════════════════════════════════════════════════
	console.log("─── Step 6: POST /production/csids → PCSID ───");
	const productionResult = await requestProductionCSID(
		complianceResult.requestId!,
		complianceResult.csid!,
		complianceResult.secret!,
	);
	results.push({
		step: 6,
		name: "Production CSID",
		ok: productionResult.success,
		details: productionResult.success
			? `requestId: ${productionResult.requestId}`
			: undefined,
		errors: productionResult.errors,
	});

	if (productionResult.success) {
		console.log(`✅ Step 6: PCSID obtained (requestId: ${productionResult.requestId})\n`);
	} else {
		console.error(`❌ Step 6: Production CSID failed:`, productionResult.errors);
		return results;
	}

	// ════════════════════════════════════════════════════════════════════
	// Step 7: Reporting (simplified invoice)
	// ════════════════════════════════════════════════════════════════════
	console.log("─── Step 7: POST /invoices/reporting/single ───");
	counter++;
	const reportUuid = crypto.randomUUID();
	const reportInvoiceData: ZatcaInvoiceData = {
		uuid: reportUuid,
		invoiceNumber: `INV-${String(counter).padStart(4, "0")}`,
		issueDate: new Date().toISOString().split("T")[0]!,
		issueTime: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
		invoiceTypeCode: "388",
		isSimplified: true,
		seller: {
			name: TEST_ORG,
			taxNumber: TEST_VAT,
			address: {
				street: "Prince Sultan St",
				buildingNumber: "2322",
				city: "Riyadh",
				postalCode: "23333",
				district: "Al-Murabba",
				countryCode: "SA",
			},
		},
		lineItems: [
			{
				id: "1",
				name: "Construction Service",
				quantity: 2,
				unitPrice: 500,
				taxCategory: "S",
				taxPercent: 15,
				lineTotal: 1000,
			},
		],
		totals: {
			subtotal: 1000,
			totalDiscount: 0,
			taxableAmount: 1000,
			taxAmount: 150,
			totalWithVat: 1150,
			payableAmount: 1150,
		},
		previousInvoiceHash: previousHash,
		invoiceCounter: counter,
	};

	const reportXml = buildInvoiceXml(reportInvoiceData);
	const reportSigned = signInvoice(
		reportXml,
		csrResult.privateKey,
		productionResult.csid!,
		csrResult.publicKey,
	);
	previousHash = reportSigned.invoiceHash;

	const reportResult = await reportInvoice(
		Buffer.from(reportSigned.signedXml).toString("base64"),
		reportSigned.invoiceHash,
		reportUuid,
		productionResult.csid!,
		productionResult.secret!,
	);

	results.push({
		step: 7,
		name: "Reporting (B2C)",
		ok: reportResult.success,
		details: `status: ${reportResult.status}`,
		errors: reportResult.errors,
		warnings: reportResult.warnings,
	});

	if (reportResult.success) {
		console.log(`✅ Step 7: Reporting success (status: ${reportResult.status})`);
		if (reportResult.warnings?.length) {
			console.log(`   ⚠️ Warnings:`, reportResult.warnings);
		}
	} else {
		console.error(`❌ Step 7: Reporting failed:`, reportResult.errors);
	}
	console.log();

	// ════════════════════════════════════════════════════════════════════
	// Step 8: Clearance (standard invoice)
	// ════════════════════════════════════════════════════════════════════
	console.log("─── Step 8: POST /invoices/clearance/single ───");
	counter++;
	const clearUuid = crypto.randomUUID();
	const clearInvoiceData: ZatcaInvoiceData = {
		uuid: clearUuid,
		invoiceNumber: `INV-${String(counter).padStart(4, "0")}`,
		issueDate: new Date().toISOString().split("T")[0]!,
		issueTime: new Date().toISOString().split("T")[1]!.replace(/\.\d+Z/, ""),
		invoiceTypeCode: "388",
		isSimplified: false,
		deliveryDate: new Date().toISOString().split("T")[0]!,
		seller: {
			name: TEST_ORG,
			taxNumber: TEST_VAT,
			address: {
				street: "Prince Sultan St",
				buildingNumber: "2322",
				city: "Riyadh",
				postalCode: "23333",
				district: "Al-Murabba",
				countryCode: "SA",
			},
		},
		buyer: {
			name: "Test Buyer Co",
			taxNumber: "300000000000003",
			address: { city: "Jeddah", countryCode: "SA" },
		},
		lineItems: [
			{
				id: "1",
				name: "Construction Materials",
				quantity: 5,
				unitPrice: 200,
				taxCategory: "S",
				taxPercent: 15,
				lineTotal: 1000,
			},
		],
		totals: {
			subtotal: 1000,
			totalDiscount: 0,
			taxableAmount: 1000,
			taxAmount: 150,
			totalWithVat: 1150,
			payableAmount: 1150,
		},
		previousInvoiceHash: previousHash,
		invoiceCounter: counter,
	};

	const clearXml = buildInvoiceXml(clearInvoiceData);
	const clearSigned = signInvoice(
		clearXml,
		csrResult.privateKey,
		productionResult.csid!,
		csrResult.publicKey,
	);

	const clearResult = await clearInvoice(
		Buffer.from(clearSigned.signedXml).toString("base64"),
		clearSigned.invoiceHash,
		clearUuid,
		productionResult.csid!,
		productionResult.secret!,
	);

	results.push({
		step: 8,
		name: "Clearance (B2B)",
		ok: clearResult.success,
		details: `status: ${clearResult.status}, hasClearedXml: ${!!clearResult.clearedInvoice}`,
		errors: clearResult.errors,
		warnings: clearResult.warnings,
	});

	if (clearResult.success) {
		console.log(`✅ Step 8: Clearance success (status: ${clearResult.status})`);
		console.log(`   📄 Cleared XML received: ${!!clearResult.clearedInvoice}`);
		if (clearResult.warnings?.length) {
			console.log(`   ⚠️ Warnings:`, clearResult.warnings);
		}
	} else {
		console.error(`❌ Step 8: Clearance failed:`, clearResult.errors);
	}
	console.log();

	// ════════════════════════════════════════════════════════════════════
	// Summary
	// ════════════════════════════════════════════════════════════════════
	console.log("╔══════════════════════════════════════════════════════════╗");
	console.log("║                    Test Summary                         ║");
	console.log("╠══════════════════════════════════════════════════════════╣");
	for (const r of results) {
		const icon = r.ok ? "✅" : "❌";
		const line = `║ ${icon} Step ${r.step}: ${r.name.padEnd(30)} ${r.details || ""}`;
		console.log(line.padEnd(58) + "║");
	}
	const passed = results.filter((r) => r.ok).length;
	const total = results.length;
	console.log("╠══════════════════════════════════════════════════════════╣");
	console.log(`║ Result: ${passed}/${total} steps passed`.padEnd(58) + "║");
	console.log("╚══════════════════════════════════════════════════════════╝");

	return results;
}

// ─── CLI entry point ───────────────────────────────────────────────────

// Auto-detect: default to simulation if ZATCA_ENVIRONMENT not set
if (!process.env.ZATCA_ENVIRONMENT) {
	process.env.ZATCA_ENVIRONMENT = "simulation";
}

runSandboxE2ETest()
	.then((results) => {
		const allPassed = results.every((r) => r.ok);
		process.exit(allPassed ? 0 : 1);
	})
	.catch((err) => {
		console.error("Fatal error:", err);
		process.exit(1);
	});
