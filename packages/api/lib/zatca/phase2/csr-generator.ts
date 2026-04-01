/**
 * ZATCA Phase 2 — CSR Generator
 *
 * Two implementations:
 *   1. generateCSRviaOpenSSL() — uses openssl CLI (matches ZATCA SDK exactly)
 *   2. generateCSR() — delegates to OpenSSL version, falls back to Node.js crypto
 *
 * The OpenSSL approach is preferred because ZATCA validates the CSR structure
 * strictly and the SDK documentation uses openssl commands.
 */

import {
	generateKeyPairSync,
	createSign,
	randomUUID,
} from "node:crypto";
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync, rmdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CSR_CONFIG } from "./constants";
import { generateOpenSSLConf } from "./csr-openssl.conf";
import type { CSRInput, CSRResult } from "./types";
import type { ZatcaEnvironment } from "./constants";

// ═══════════════════════════════════════════════════════════
// OpenSSL-based CSR Generator (preferred)
// ═══════════════════════════════════════════════════════════

/**
 * Generate CSR using openssl CLI — matches ZATCA SDK method exactly.
 * Requires openssl in PATH (available on Linux, macOS, Windows with Git).
 */
export async function generateCSRviaOpenSSL(input: CSRInput): Promise<CSRResult> {
	const openssl = process.platform === "win32"
		? '"C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe"'
		: "openssl";
	const uuid = input.serialNumber || randomUUID();
	const invoiceType = input.invoiceType ?? "1100";
	const location = input.location || CSR_CONFIG.registeredAddress;
	const industry = input.industry || CSR_CONFIG.businessCategory;
	const env = (process.env.ZATCA_ENVIRONMENT || "sandbox") as ZatcaEnvironment;

	const cn =
		env === "production"
			? CSR_CONFIG.commonName
			: `TST-886431145-${input.vatNumber}`;

	const asciiOrg =
		input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() ||
		"Masar Platform";

	const templateName =
		env === "simulation" ? "PREZATCACode-Signing" : "ZATCA-Code-Signing";

	// 1. Create temp directory for all files
	const tmp = mkdtempSync(join(tmpdir(), "zatca-"));
	const keyFile = join(tmp, "key.pem");
	const confFile = join(tmp, "csr.conf");
	const csrFile = join(tmp, "csr.pem");

	try {
		// 2. Write OpenSSL config
		const conf = generateOpenSSLConf({
			organizationName: asciiOrg,
			location,
			cn,
			templateName,
			uuid,
			vatNumber: input.vatNumber,
			invoiceType,
			industry,
		});
		writeFileSync(confFile, conf);

		// 3. Generate EC key (secp256k1)
		const curve = process.env.ZATCA_EC_CURVE || "secp256k1";
		execSync(
			`${openssl} ecparam -name ${curve} -genkey -noout -out "${keyFile}"`,
			{ stdio: "pipe" },
		);

		// 3b. Convert SEC1 key to PKCS8 (invoice-signer expects PKCS8)
		const p8File = `${keyFile}.p8`;
		execSync(
			`${openssl} pkcs8 -topk8 -nocrypt -in "${keyFile}" -out "${p8File}"`,
			{ stdio: "pipe" },
		);
		writeFileSync(keyFile, readFileSync(p8File, "utf-8"));
		try { unlinkSync(p8File); } catch {}

		// 4. Generate CSR
		execSync(
			`${openssl} req -new -sha256 -key "${keyFile}" -config "${confFile}" -out "${csrFile}"`,
			{ stdio: "pipe" },
		);

		// 5. Read results
		const privateKeyPem = readFileSync(keyFile, "utf-8");
		const csrPem = readFileSync(csrFile, "utf-8");

		// 6. Extract public key from private key
		const publicKeyPem = execSync(
			`${openssl} ec -in "${keyFile}" -pubout`,
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
		);

		// 7. base64-encode the entire PEM string (what ZATCA API expects)
		const csrBase64 = Buffer.from(csrPem).toString("base64");

		console.log("[ZATCA] CSR generated (OpenSSL) — length:", csrBase64.length, "| CN:", cn);

		return {
			csr: csrBase64,
			privateKey: privateKeyPem,
			publicKey: publicKeyPem.trim(),
		};
	} finally {
		// Cleanup temp files
		try { unlinkSync(keyFile); } catch {}
		try { unlinkSync(confFile); } catch {}
		try { unlinkSync(csrFile); } catch {}
		try { rmdirSync(tmp); } catch {}
	}
}

// ═══════════════════════════════════════════════════════════
// Main entry point — OpenSSL first, Node.js fallback
// ═══════════════════════════════════════════════════════════

/**
 * Generate CSR — tries OpenSSL first, falls back to Node.js crypto.
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	try {
		return await generateCSRviaOpenSSL(input);
	} catch (err) {
		console.warn("[ZATCA] OpenSSL not available, falling back to Node.js crypto CSR:", (err as Error).message);
		return generateCSRviaCrypto(input);
	}
}

// ═══════════════════════════════════════════════════════════
// Node.js crypto fallback (kept for Vercel serverless)
// ═══════════════════════════════════════════════════════════

function derLength(len: number): Buffer {
	if (len < 0x80) return Buffer.from([len]);
	if (len < 0x100) return Buffer.from([0x81, len]);
	return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function derWrap(tag: number, content: Buffer): Buffer {
	return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}

const derSequence = (...items: Buffer[]) => derWrap(0x30, Buffer.concat(items));
const derSet = (...items: Buffer[]) => derWrap(0x31, Buffer.concat(items));
const derOctetString = (data: Buffer) => derWrap(0x04, data);
const derUTF8String = (str: string) => derWrap(0x0c, Buffer.from(str, "utf8"));
const derPrintableString = (str: string) => derWrap(0x13, Buffer.from(str, "ascii"));

function derBitString(data: Buffer, unusedBits = 0): Buffer {
	return derWrap(0x03, Buffer.concat([Buffer.from([unusedBits]), data]));
}

function derInteger(value: number): Buffer {
	if (value === 0) return derWrap(0x02, Buffer.from([0]));
	const bytes: number[] = [];
	let v = value;
	while (v > 0) { bytes.unshift(v & 0xff); v >>= 8; }
	if (bytes[0]! & 0x80) bytes.unshift(0);
	return derWrap(0x02, Buffer.from(bytes));
}

function derOID(oid: string): Buffer {
	const parts = oid.split(".").map(Number);
	const bytes: number[] = [40 * parts[0]! + parts[1]!];
	for (let i = 2; i < parts.length; i++) {
		let val = parts[i]!;
		if (val < 128) { bytes.push(val); }
		else {
			const temp: number[] = [];
			temp.unshift(val & 0x7f); val >>= 7;
			while (val > 0) { temp.unshift((val & 0x7f) | 0x80); val >>= 7; }
			bytes.push(...temp);
		}
	}
	return derWrap(0x06, Buffer.from(bytes));
}

function derContextTag(tag: number, content: Buffer): Buffer {
	return Buffer.concat([Buffer.from([0xa0 | tag]), derLength(content.length), content]);
}

function derRDN(oid: string, value: Buffer): Buffer {
	return derSet(derSequence(derOID(oid), value));
}

const OID = {
	countryName: "2.5.4.6", organization: "2.5.4.10", organizationUnit: "2.5.4.11",
	commonName: "2.5.4.3", serialNumber: "2.5.4.5",
	userId: "0.9.2342.19200300.100.1.1", title: "2.5.4.12",
	registeredAddress: "2.5.4.26", businessCategory: "2.5.4.15",
	ecdsaWithSHA256: "1.2.840.10045.4.3.2",
	extensionRequest: "1.2.840.113549.1.9.14",
	certificateTemplateName: "1.3.6.1.4.1.311.20.2",
	subjectAltName: "2.5.29.17",
} as const;

async function generateCSRviaCrypto(input: CSRInput): Promise<CSRResult> {
	const serialNumber = input.serialNumber || randomUUID();
	const invoiceType = input.invoiceType ?? "1100";
	const location = input.location || CSR_CONFIG.registeredAddress;
	const industry = input.industry || CSR_CONFIG.businessCategory;
	const env = (process.env.ZATCA_ENVIRONMENT || "sandbox") as ZatcaEnvironment;
	const curve = process.env.ZATCA_EC_CURVE || "secp256k1";

	const keyPair = generateKeyPairSync("ec", { namedCurve: curve });
	const privateKeyPem = keyPair.privateKey.export({ type: "sec1", format: "pem" }) as string;
	const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" }) as string;
	const publicKeySpkiDer = keyPair.publicKey.export({ type: "spki", format: "der" });

	const cn = env === "production" ? CSR_CONFIG.commonName : `TST-886431145-${input.vatNumber}`;
	const asciiOrg = input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() || "Masar Platform";
	const ou = input.location || "Main Branch";
	const templateName = env === "simulation" ? "PREZATCACode-Signing" : "ZATCA-Code-Signing";
	const snPrefix = env === "production" ? "1-Masar|2-EGS1|3-" : "1-TST|2-TST|3-";

	const subject = derSequence(
		derRDN(OID.countryName, derPrintableString("SA")),
		derRDN(OID.organization, derUTF8String(asciiOrg)),
		derRDN(OID.organizationUnit, derUTF8String(ou)),
		derRDN(OID.commonName, derUTF8String(cn)),
	);

	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derUTF8String(templateName)),
	);

	const altNameDirName = derSequence(
		derRDN(OID.serialNumber, derUTF8String(`${snPrefix}${serialNumber}`)),
		derRDN(OID.userId, derUTF8String(input.vatNumber)),
		derRDN(OID.title, derUTF8String(invoiceType)),
		derRDN(OID.registeredAddress, derUTF8String(location)),
		derRDN(OID.businessCategory, derUTF8String(industry)),
	);

	const subjectAltNameExt = derSequence(
		derOID(OID.subjectAltName),
		derOctetString(derSequence(derContextTag(4, altNameDirName))),
	);

	const attributes = derContextTag(0, derSequence(
		derOID(OID.extensionRequest),
		derSet(derSequence(certTemplateExt, subjectAltNameExt)),
	));

	const certRequestInfo = derSequence(derInteger(0), subject, publicKeySpkiDer, attributes);

	const signer = createSign("SHA256");
	signer.update(certRequestInfo);
	const signatureDer = signer.sign(keyPair.privateKey);

	const csrDer = derSequence(
		certRequestInfo,
		derSequence(derOID(OID.ecdsaWithSHA256)),
		derBitString(signatureDer),
	);

	const derBase64 = csrDer.toString("base64");
	const wrappedDer = derBase64.replace(/(.{64})/g, "$1\n");
	const pemBody = wrappedDer.endsWith("\n") ? wrappedDer : wrappedDer + "\n";
	const pemString = `-----BEGIN CERTIFICATE REQUEST-----\n${pemBody}-----END CERTIFICATE REQUEST-----\n`;
	const csrBase64 = Buffer.from(pemString).toString("base64");

	console.log("[ZATCA] CSR generated (Node.js fallback) — length:", csrBase64.length, "| CN:", cn);

	return { csr: csrBase64, privateKey: privateKeyPem, publicKey: publicKeyPem };
}
