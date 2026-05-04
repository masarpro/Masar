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
import * as forge from "node-forge";
import { CSR_CONFIG } from "./constants";
import { generateOpenSSLConf } from "./csr-openssl.conf";
import type { CSRInput, CSRResult } from "./types";
import type { ZatcaEnvironment } from "./constants";

// Module-level cache: once OpenSSL CLI fails on this runtime (e.g. Vercel's
// broken binary with `SSL_get_srp_g` symbol mismatch), don't keep trying.
let openSSLBroken = false;

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
	const env = (process.env.ZATCA_ENVIRONMENT || "simulation") as ZatcaEnvironment;

	// Production CN must be unique per EGS unit — ZATCA rejects collisions
	// across merchants. Embed the VAT number so each merchant has a distinct CN.
	const cn =
		env === "production"
			? `${CSR_CONFIG.commonName}-${input.vatNumber}`
			: `TST-886431145-${input.vatNumber}`;

	const asciiOrg =
		input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() ||
		"Masar Platform";

	// Per ZATCA SDK / zatca-xml-js reference:
	//   sandbox/simulation → "TSTZATCA-Code-Signing"
	//   production         → "ZATCA-Code-Signing"
	// (The earlier value "PREZATCACode-Signing" is unsupported by ZATCA.)
	const templateName =
		env === "production" ? "ZATCA-Code-Signing" : "TSTZATCA-Code-Signing";

	const snPrefix =
		env === "production" ? "1-Masar|2-EGS1|3-" : "1-TST|2-TST|3-";

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
			branchName: location,
			cn,
			templateName,
			uuid,
			vatNumber: input.vatNumber,
			invoiceType,
			industry,
			snPrefix,
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
 * Once OpenSSL fails on a runtime, we skip it for the rest of the process
 * lifetime to avoid wasted ~50ms per request on broken Vercel binaries.
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	if (openSSLBroken) {
		const result = await generateCSRviaCrypto(input);
		validateCSRStructure(result.csr);
		return result;
	}

	try {
		const result = await generateCSRviaOpenSSL(input);
		validateCSRStructure(result.csr);
		return result;
	} catch (err) {
		const msg = (err as Error).message;
		console.warn("[ZATCA] OpenSSL not available, falling back to Node.js crypto CSR:", msg);
		// Lock the fallback for the remaining process lifetime when the binary
		// is broken (symbol mismatch is non-recoverable on Vercel).
		if (msg.includes("symbol lookup error") || msg.includes("ENOENT")) {
			openSSLBroken = true;
		}
		const result = await generateCSRviaCrypto(input);
		validateCSRStructure(result.csr);
		return result;
	}
}

/**
 * Decode the produced CSR with node-forge to confirm the ASN.1 structure
 * parses correctly. Logs subject + extensions so we can diagnose ZATCA
 * "Invalid-CSR" responses from the Vercel logs alone.
 */
function validateCSRStructure(csrBase64: string): void {
	try {
		const pem = Buffer.from(csrBase64, "base64").toString("utf-8");
		const csr = forge.pki.certificationRequestFromPem(pem);
		const subjectStr = csr.subject.attributes
			.map((a) => `${a.shortName ?? a.type}=${a.value}`)
			.join(", ");
		console.log("[ZATCA] CSR validated by node-forge — Subject:", subjectStr);
	} catch (err) {
		// node-forge may fail on secp256k1 (it lacks native support) — that's
		// fine for the signature check, but it should still parse the ASN.1
		// envelope. Surface the error so we can spot real structural issues.
		console.warn("[ZATCA] node-forge CSR parse failed:", (err as Error).message);
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
	const env = (process.env.ZATCA_ENVIRONMENT || "simulation") as ZatcaEnvironment;
	const curve = process.env.ZATCA_EC_CURVE || "secp256k1";

	const keyPair = generateKeyPairSync("ec", { namedCurve: curve });
	// PKCS8 format — matches OpenSSL version and what invoice-signer expects
	const privateKeyPem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" }) as string;
	const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" }) as string;
	const publicKeySpkiDer = keyPair.publicKey.export({ type: "spki", format: "der" });

	// Production CN must be unique per EGS unit (see OpenSSL path comment).
	const cn = env === "production"
		? `${CSR_CONFIG.commonName}-${input.vatNumber}`
		: `TST-886431145-${input.vatNumber}`;
	const asciiOrg = input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() || "Masar Platform";
	// Match the ZATCA SDK template names exactly. "PREZATCACode-Signing"
	// (which we used previously) is not recognized by ZATCA.
	const templateName = env === "production" ? "ZATCA-Code-Signing" : "TSTZATCA-Code-Signing";
	const snPrefix = env === "production" ? "1-Masar|2-EGS1|3-" : "1-TST|2-TST|3-";

	// Subject DN — matches the ZATCA reference template order: CN, OU, O, C.
	// Strings are PrintableString (utf8 = no in the official conf) when the
	// content is pure ASCII — which it is, since asciiOrg/location/cn are
	// pre-stripped to printable ASCII.
	const subject = derSequence(
		derRDN(OID.commonName, derPrintableString(cn)),
		derRDN(OID.organizationUnit, derPrintableString(location)),
		derRDN(OID.organization, derPrintableString(asciiOrg)),
		derRDN(OID.countryName, derPrintableString("SA")),
	);

	// SAN dirName — PrintableString to match `utf8 = no` in the ZATCA conf.
	// (OpenSSL with utf8=no encodes ASCII fields as PrintableString; using
	// UTF8String here produced byte-level mismatches versus the conf path.)
	const altNameDirName = derSequence(
		derRDN(OID.serialNumber, derPrintableString(`${snPrefix}${serialNumber}`)),
		derRDN(OID.userId, derPrintableString(input.vatNumber)),
		derRDN(OID.title, derPrintableString(invoiceType)),
		derRDN(OID.registeredAddress, derPrintableString(location)),
		derRDN(OID.businessCategory, derPrintableString(industry)),
	);

	const subjectAltNameExt = derSequence(
		derOID(OID.subjectAltName),
		derOctetString(derSequence(derContextTag(4, altNameDirName))),
	);

	// Certificate template name — UTF8String per the ZATCA SDK conf
	// (1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:...).
	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derUTF8String(templateName)),
	);

	// Extensions ordered to match ZATCA conf: cert template FIRST, then SAN.
	// (OpenSSL emits extensions in conf-section order; reversing this caused
	// validator-level differences against the reference template.)
	const attributes = derContextTag(0, derSequence(
		derOID(OID.extensionRequest),
		derSet(derSequence(certTemplateExt, subjectAltNameExt)),
	));

	const certRequestInfo = derSequence(derInteger(0), subject, publicKeySpkiDer, attributes);

	const signer = createSign("SHA256");
	signer.update(certRequestInfo);
	// Force DER-encoded ECDSA signature (SEQUENCE { r INTEGER, s INTEGER }).
	// Node default is "der" since v17 but being explicit avoids regressions.
	const signatureDer = signer.sign({
		key: keyPair.privateKey,
		dsaEncoding: "der",
	});

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

	console.log(
		"[ZATCA] CSR generated (Node.js fallback) — outer base64 len:",
		csrBase64.length,
		"| DER bytes:",
		csrDer.length,
		"| CN:",
		cn,
		"| template:",
		templateName,
	);
	// Hex dump of the DER for offline byte-level diff against a known-good CSR
	console.log("[ZATCA] CSR DER hex:", csrDer.toString("hex"));
	// Also dump the SPKI bytes (ZATCA validates the secp256k1 algorithm OID)
	console.log("[ZATCA] SPKI hex:", Buffer.from(publicKeySpkiDer).toString("hex"));

	return { csr: csrBase64, privateKey: privateKeyPem, publicKey: publicKeyPem };
}
