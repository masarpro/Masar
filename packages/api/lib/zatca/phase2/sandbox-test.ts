/**
 * ZATCA Sandbox Test — temporary diagnostic
 *
 * Sends the sample CSR from ZATCA's Swagger documentation in two formats
 * to determine the correct encoding expected by the sandbox API.
 *
 * Test 1: SAMPLE_CSR as-is (Base64 of full PEM with headers) — per Swagger example
 * Test 2: Cleaned CSR (raw DER Base64, no PEM headers)
 */

import { ZATCA_URLS, ZATCA_PATHS, SANDBOX_DEFAULTS } from "./constants";

// Sample CSR from ZATCA Swagger documentation (Base64-encoded PEM)
const SAMPLE_CSR =
	"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ0tUQ0NBZGNDQVFBd1pURUxNQWtHQTFVRUJoTUNVMEV4RFRBTEJnTlZCQXNNQkRFeE1URXhGVEFUQmdOVkJBb01ERlJsYzNRZ1EyOXRjR0Z1ZVRBWE1CVUdBMVVFQXd3T1ZGTlVMVEl6TkRVMk56ZzVNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVvV0dpdkRNNjhHRkdNMFVmckxVWFM1OGdDQzFIRUdpNXdOc0RCK0RRYWt2MjlPODJXc2RXNHNVU1RYSFpuTXcwbHlScWJIak0wZ1AyRFRXaVFxN3FPQ0JqQ0NCYTB3Z2dXcE1Ba0dBMVVkRXdRQ01BQXdEZ1lEVlIwUEFRSC9CQVFEQWdYZ01CVUdDU3NHQVFRQmdqY1VBZ1FJTUF3V0NsUk5VeTB3TURBeE1CY0dBMVVkRVFRUU1BNmtEREFLTVFnd0JnWURWUVFGRXdBeE1RZ3dCZ1lJWUlaSUFXVURCQUVNQURFSE1BVUdBMVVFRGd3QU1ROHdEUVlEVlFRYURBWktaV1JrWVdneEZUQVRCZ05WQkE0TURRR0NNSFl3TlRBd01EQXdNREFLQmdncWhrak9QUVFEQWdOSkFEQkdBaUVBbmdNSFQvNmpTS3NDOWc0UU42elVGR0V0dFVTZmxyUU9UZFNMR3RlN0I1MENJUUN1TFdjeVlvMHNGbFVnMWlaRUxPeHpYdmovbjR1NW5EK0dPRGVKNk5xYU09Ci0tLS0tRU5EIENFUlRJRklDQVRFIFJFUVVFU1QtLS0tLQo=";

/** Strip PEM headers/footers, return raw Base64 of DER */
function cleanCSR(pem64: string): string {
	const pem = Buffer.from(pem64, "base64").toString("utf8");
	return pem
		.replace(/-----BEGIN CERTIFICATE REQUEST-----/g, "")
		.replace(/-----END CERTIFICATE REQUEST-----/g, "")
		.replace(/\r?\n/g, "")
		.trim();
}

const ZATCA_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
	"Accept-Language": "en",
	"Accept-Version": "V2",
	OTP: SANDBOX_DEFAULTS.otp,
} as const;

async function sendCSR(
	url: string,
	csr: string,
	label: string,
): Promise<{ status: number; body: unknown }> {
	console.log(`[${label}] CSR length: ${csr.length}`);
	console.log(`[${label}] CSR first 60: ${csr.substring(0, 60)}`);

	const response = await fetch(url, {
		method: "POST",
		headers: ZATCA_HEADERS,
		body: JSON.stringify({ csr }),
	});

	const bodyText = await response.text();
	console.log(`[${label}] Status: ${response.status}`);
	console.log(`[${label}] Body: ${bodyText.substring(0, 300)}`);

	let body: unknown;
	try {
		body = JSON.parse(bodyText);
	} catch {
		body = bodyText;
	}

	return { status: response.status, body };
}

export async function testSandboxWithSampleCSR(): Promise<{
	test1_pem_base64: { status: number; body: unknown };
	test2_der_base64: { status: number; body: unknown };
}> {
	const url = `${ZATCA_URLS.sandbox}${ZATCA_PATHS.complianceCSID}`;
	console.log("[SANDBOX TEST] URL:", url);

	// Test 1: Sample CSR as-is (Base64 of full PEM — per Swagger example)
	const test1 = await sendCSR(url, SAMPLE_CSR, "TEST 1 — PEM Base64");

	// Test 2: Sample CSR stripped (just DER Base64, no PEM headers)
	const cleanedCSR = cleanCSR(SAMPLE_CSR);
	const test2 = await sendCSR(url, cleanedCSR, "TEST 2 — DER Base64");

	return {
		test1_pem_base64: test1,
		test2_der_base64: test2,
	};
}
