/**
 * ZATCA Sandbox Test — temporary diagnostic
 *
 * Sends the sample CSR from ZATCA's Swagger documentation to verify
 * that the sandbox API is reachable and accepting CSRs.
 * This isolates whether the issue is our CSR structure or something else.
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

export async function testSandboxWithSampleCSR(): Promise<{
	sampleCSRResult: { status: number; body: unknown };
}> {
	const baseUrl = ZATCA_URLS.sandbox;
	const url = `${baseUrl}${ZATCA_PATHS.complianceCSID}`;

	const cleanedCSR = cleanCSR(SAMPLE_CSR);

	console.log("[SANDBOX TEST] Using sample CSR from Swagger");
	console.log("[SANDBOX TEST] URL:", url);
	console.log("[SANDBOX TEST] CSR length:", cleanedCSR.length);
	console.log("[SANDBOX TEST] CSR first 60:", cleanedCSR.substring(0, 60));

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			"Accept-Language": "en",
			"Accept-Version": "V2",
			OTP: SANDBOX_DEFAULTS.otp,
		},
		body: JSON.stringify({ csr: cleanedCSR }),
	});

	const bodyText = await response.text();
	console.log("[SANDBOX TEST] Response status:", response.status);
	console.log("[SANDBOX TEST] Response body:", bodyText);

	let body: unknown;
	try {
		body = JSON.parse(bodyText);
	} catch {
		body = bodyText;
	}

	return {
		sampleCSRResult: { status: response.status, body },
	};
}
