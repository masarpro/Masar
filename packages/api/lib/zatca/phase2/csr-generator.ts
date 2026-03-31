/**
 * ZATCA Phase 2 — CSR Generator
 *
 * Generates ECDSA secp256k1 key pair + CSR with all ZATCA-required fields.
 * Uses Node.js crypto for key generation and signing — works on Vercel Serverless.
 *
 * Per ZATCA Developer Portal Manual v3, Appendix 5.3.2.1 (page 93):
 *   openssl ecparam -name secp256k1 -genkey -noout -out PrivateKey.pem
 *
 * - Subject DN: C=SA, OU=orgName, O=orgName, CN=TST-886431145-{taxNumber}
 * - Extensions: basicConstraints, keyUsage, certificateTemplateName, subjectAltName
 * - Key: ECDSA secp256k1, ecdsaWithSHA256
 */

import {
	generateKeyPairSync,
	createSign,
	randomUUID,
} from "node:crypto";
import { CSR_CONFIG } from "./constants";
import type { CSRInput, CSRResult } from "./types";
import type { ZatcaEnvironment } from "./constants";

// ═══════════════════════════════════════════════════════════
// ASN.1 DER Encoding Helpers
// ═══════════════════════════════════════════════════════════

function derLength(len: number): Buffer {
	if (len < 0x80) return Buffer.from([len]);
	if (len < 0x100) return Buffer.from([0x81, len]);
	return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function derWrap(tag: number, content: Buffer): Buffer {
	return Buffer.concat([
		Buffer.from([tag]),
		derLength(content.length),
		content,
	]);
}

const derSequence = (...items: Buffer[]) =>
	derWrap(0x30, Buffer.concat(items));
const derSet = (...items: Buffer[]) => derWrap(0x31, Buffer.concat(items));
const derOctetString = (data: Buffer) => derWrap(0x04, data);
const derUTF8String = (str: string) =>
	derWrap(0x0c, Buffer.from(str, "utf8"));
const derPrintableString = (str: string) =>
	derWrap(0x13, Buffer.from(str, "ascii"));
const derBoolean = (val: boolean) =>
	derWrap(0x01, Buffer.from([val ? 0xff : 0x00]));

function derBitString(data: Buffer, unusedBits = 0): Buffer {
	return derWrap(
		0x03,
		Buffer.concat([Buffer.from([unusedBits]), data]),
	);
}

function derInteger(value: number): Buffer {
	if (value === 0) return derWrap(0x02, Buffer.from([0]));
	const bytes: number[] = [];
	let v = value;
	while (v > 0) {
		bytes.unshift(v & 0xff);
		v >>= 8;
	}
	if (bytes[0]! & 0x80) bytes.unshift(0);
	return derWrap(0x02, Buffer.from(bytes));
}

function derOID(oid: string): Buffer {
	const parts = oid.split(".").map(Number);
	const bytes: number[] = [40 * parts[0]! + parts[1]!];
	for (let i = 2; i < parts.length; i++) {
		let val = parts[i]!;
		if (val < 128) {
			bytes.push(val);
		} else {
			const temp: number[] = [];
			temp.unshift(val & 0x7f);
			val >>= 7;
			while (val > 0) {
				temp.unshift((val & 0x7f) | 0x80);
				val >>= 7;
			}
			bytes.push(...temp);
		}
	}
	return derWrap(0x06, Buffer.from(bytes));
}

/** Context-specific constructed tag: [tag] IMPLICIT */
function derContextTag(tag: number, content: Buffer): Buffer {
	const tagByte = 0xa0 | tag;
	return Buffer.concat([
		Buffer.from([tagByte]),
		derLength(content.length),
		content,
	]);
}

/** One RDN: SET { SEQUENCE { OID, value } } */
function derRDN(oid: string, value: Buffer): Buffer {
	return derSet(derSequence(derOID(oid), value));
}

// ═══════════════════════════════════════════════════════════
// OID Constants
// ═══════════════════════════════════════════════════════════

const OID = {
	// Subject DN
	countryName: "2.5.4.6",
	organizationUnit: "2.5.4.11",
	organization: "2.5.4.10",
	commonName: "2.5.4.3",
	// SubjectAltName dirName
	serialNumber: "2.5.4.5",
	userId: "0.9.2342.19200300.100.1.1",
	title: "2.5.4.12",
	registeredAddress: "2.5.4.26",
	businessCategory: "2.5.4.15",
	// Algorithms
	ecPublicKey: "1.2.840.10045.2.1",
	secp256k1: "1.3.132.0.10", // secp256k1 — per ZATCA Developer Portal Manual v3
	ecdsaWithSHA256: "1.2.840.10045.4.3.2",
	// Extensions
	extensionRequest: "1.2.840.113549.1.9.14",
	basicConstraints: "2.5.29.19",
	keyUsage: "2.5.29.15",
	subjectAltName: "2.5.29.17",
	certificateTemplateName: "1.3.6.1.4.1.311.20.2",
} as const;

// ═══════════════════════════════════════════════════════════
// CSR Generator
// ═══════════════════════════════════════════════════════════

/**
 * Generate an ECDSA secp256k1 key pair + ZATCA-compliant CSR.
 * Uses Node.js crypto — no OpenSSL CLI, no temp files, works on Vercel.
 *
 * ZATCA Developer Portal Manual v3, Appendix 5.3.2.1 (page 93):
 *   openssl ecparam -name secp256k1
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	const serialNumber = input.serialNumber || randomUUID();
	const invoiceType = input.invoiceType ?? "1100";
	const location = input.location || CSR_CONFIG.registeredAddress;
	const industry = input.industry || CSR_CONFIG.businessCategory;
	const env = (process.env.ZATCA_ENVIRONMENT || "sandbox") as ZatcaEnvironment;

	// 1. Generate ECDSA secp256k1 key pair via Node.js crypto
	//    Per ZATCA Developer Portal Manual v3, Appendix 5.3.2.1
	const keyPair = generateKeyPairSync("ec", { namedCurve: "secp256k1" });

	const privateKeyPem = keyPair.privateKey.export({
		type: "sec1",
		format: "pem",
	}) as string;

	const publicKeyPem = keyPair.publicKey.export({
		type: "spki",
		format: "pem",
	}) as string;

	// SPKI DER — used directly as SubjectPublicKeyInfo in the CSR
	const publicKeySpkiDer = keyPair.publicKey.export({
		type: "spki",
		format: "der",
	});

	// 2. Subject DN — ASCII only (no Arabic), ZATCA rejects non-ASCII in Subject
	const cn =
		env === "production"
			? CSR_CONFIG.commonName
			: `TST-886431145-${input.vatNumber}`;

	// Use ASCII-safe org name: strip non-ASCII chars, fallback to defaults
	const asciiOrg = input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() || "Masar Platform";
	const asciiOU = "Main Branch";

	const subject = derSequence(
		derRDN(OID.countryName, derPrintableString(CSR_CONFIG.country)),
		derRDN(OID.organizationUnit, derUTF8String(asciiOU)),
		derRDN(OID.organization, derUTF8String(asciiOrg)),
		derRDN(OID.commonName, derUTF8String(cn)),
	);

	// 3. Extensions
	// 3a. basicConstraints: CA:FALSE (empty SEQUENCE = default FALSE)
	const basicConstraintsExt = derSequence(
		derOID(OID.basicConstraints),
		derOctetString(derSequence()),
	);

	// 3b. keyUsage: digitalSignature + nonRepudiation + keyEncipherment (critical)
	//     Bits 0,1,2 set → 0xE0, unused bits = 5
	const keyUsageExt = derSequence(
		derOID(OID.keyUsage),
		derBoolean(true), // critical
		derOctetString(derBitString(Buffer.from([0xe0]), 5)),
	);

	// 3c. certificateTemplateName — UTF8String per ZATCA spec
	const templateName =
		env === "production" ? "ZATCA-Code-Signing" : "TSTZATCA-Code-Signing";
	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derUTF8String(templateName)),
	);

	// 3d. subjectAltName dirName (SN, UID, title, registeredAddress, businessCategory)
	const altNameDirName = derSequence(
		derRDN(
			OID.serialNumber,
			derUTF8String(`1-Masar|2-001|3-${serialNumber}`),
		),
		derRDN(OID.userId, derUTF8String(input.vatNumber)),
		derRDN(OID.title, derUTF8String(invoiceType)),
		derRDN(OID.registeredAddress, derUTF8String(location)),
		derRDN(OID.businessCategory, derUTF8String(industry)),
	);

	const subjectAltNameExt = derSequence(
		derOID(OID.subjectAltName),
		derOctetString(
			derSequence(derContextTag(4, altNameDirName)), // GeneralNames → directoryName [4]
		),
	);

	// 4. Attributes: [0] IMPLICIT SET OF Attribute → extensionRequest
	const attributes = derContextTag(
		0,
		derSequence(
			derOID(OID.extensionRequest),
			derSet(
				derSequence(
					basicConstraintsExt,
					keyUsageExt,
					certTemplateExt,
					subjectAltNameExt,
				),
			),
		),
	);

	// 5. CertificationRequestInfo
	const certRequestInfo = derSequence(
		derInteger(0), // version 0
		subject,
		publicKeySpkiDer, // SPKI DER from Node.js crypto
		attributes,
	);

	// 6. Sign with ECDSA-SHA256 via Node.js crypto
	const signer = createSign("SHA256");
	signer.update(certRequestInfo);
	const signatureDer = signer.sign(keyPair.privateKey);

	// 7. Complete CertificationRequest
	const csrDer = derSequence(
		certRequestInfo,
		derSequence(derOID(OID.ecdsaWithSHA256)),
		derBitString(signatureDer),
	);

	// 8. CSR as raw Base64 of DER — no PEM headers, no newlines
	const csrBase64 = csrDer.toString("base64");

	// DEBUG — verify correct EC curve OID in CSR
	const p256OID = Buffer.from([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);
	const k1OID = Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a]);
	console.log("[ZATCA DEBUG] CSR uses secp256k1 (correct):", csrDer.includes(k1OID));
	console.log("[ZATCA DEBUG] CSR uses P-256 (WRONG):", csrDer.includes(p256OID));
	console.log("[ZATCA DEBUG] CSR Base64 length:", csrBase64.length);
	console.log("[ZATCA DEBUG] CSR first 60:", csrBase64.substring(0, 60));

	return {
		csr: csrBase64,
		privateKey: privateKeyPem,
		publicKey: publicKeyPem,
	};
}
