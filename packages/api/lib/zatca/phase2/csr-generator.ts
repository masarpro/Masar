/**
 * ZATCA Phase 2 — CSR Generator (OpenSSL CLI)
 *
 * Generates ECDSA secp256k1 key pair + CSR with all ZATCA-required fields.
 * Uses OpenSSL CLI via child_process — the only reliable way to produce
 * the exact CSR format ZATCA expects (per Developer Portal Manual v3, Appendix 5.3).
 *
 * Required fields per ZATCA spec:
 * - Subject DN: C, OU, O, CN
 * - Extension: certificateTemplateName = ZATCA-Code-Signing (OID 1.3.6.1.4.1.311.20.2)
 * - SubjectAltName (dirName): SN, UID, title, registeredAddress, businessCategory
 * - Key: ECDSA secp256k1, SHA-256
 *
 * OpenSSL is available on Vercel Node.js runtime (not Edge).
 */

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CSR_CONFIG } from "./constants";
import type { CSRInput, CSRResult } from "./types";

/**
 * Generate an ECDSA secp256k1 key pair + ZATCA-compliant CSR.
 *
 * @param input - Organization name, VAT number, invoice type, etc.
 * @returns CSR (Base64 DER), private key (PEM), public key (PEM)
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	const tmpDir = mkdtempSync(join(tmpdir(), "zatca-"));

	try {
		const serialNumber = input.serialNumber || `${Date.now()}`;
		const invoiceType = input.invoiceType ?? "1100";
		const location = input.location || CSR_CONFIG.registeredAddress;
		const industry = input.industry || CSR_CONFIG.businessCategory;

		// 1. Write OpenSSL config file per ZATCA spec (Appendix 5.3)
		const configContent = `
oid_section = OIDs
[ OIDs ]
certificateTemplateName = 1.3.6.1.4.1.311.20.2

[ req ]
default_bits = 2048
req_extensions = v3_req
x509_extensions = v3_ca
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C = ${CSR_CONFIG.country}
OU = ${input.organizationName}
O = ${input.organizationName}
CN = ${CSR_CONFIG.commonName}

[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment

[req_ext]
certificateTemplateName = ASN1:PRINTABLESTRING:ZATCA-Code-Signing
subjectAltName = dirName:alt_names

[alt_names]
SN = 1-Masar|2-001|3-${serialNumber}
UID = ${input.vatNumber}
title = ${invoiceType}
registeredAddress = ${location}
businessCategory = ${industry}
`;

		const configPath = join(tmpDir, "csr.cnf");
		const privateKeyPath = join(tmpDir, "private.pem");
		const publicKeyPath = join(tmpDir, "public.pem");
		const csrPath = join(tmpDir, "csr.pem");

		writeFileSync(configPath, configContent, "utf8");

		// 2. Generate ECDSA secp256k1 private key
		execSync(
			`openssl ecparam -name secp256k1 -genkey -noout -out "${privateKeyPath}"`,
			{ stdio: "pipe" },
		);

		// 3. Generate CSR from private key + config
		execSync(
			`openssl req -new -sha256 -key "${privateKeyPath}" -extensions v3_req -config "${configPath}" -out "${csrPath}"`,
			{ stdio: "pipe" },
		);

		// 4. Extract public key (compressed form)
		execSync(
			`openssl ec -in "${privateKeyPath}" -pubout -conv_form compressed -out "${publicKeyPath}"`,
			{ stdio: "pipe" },
		);

		// 5. Read results
		const privateKey = readFileSync(privateKeyPath, "utf8");
		const publicKey = readFileSync(publicKeyPath, "utf8");
		const csrPem = readFileSync(csrPath, "utf8");

		// 6. Convert CSR PEM to Base64 (strip headers + newlines)
		const csrBase64 = csrPem
			.replace(/-----BEGIN CERTIFICATE REQUEST-----/g, "")
			.replace(/-----END CERTIFICATE REQUEST-----/g, "")
			.replace(/\r?\n/g, "")
			.trim();

		return { csr: csrBase64, privateKey, publicKey };
	} finally {
		// 7. Clean up temp files (always, even on error)
		try {
			rmSync(tmpDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	}
}
