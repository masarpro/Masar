/**
 * ZATCA Phase 2 — CSR Generator (Pure JavaScript)
 *
 * Generates ECDSA secp256k1 key pair + CSR with all ZATCA-required fields.
 * Uses @noble/curves — no OpenSSL CLI dependency, works on Vercel Serverless.
 *
 * Required fields per ZATCA spec (Developer Portal Manual v3, Appendix 5.3):
 * - Subject DN: C, OU, O, CN
 * - Extension: certificateTemplateName = ZATCA-Code-Signing (OID 1.3.6.1.4.1.311.20.2)
 * - SubjectAltName (dirName): SN, UID, title, registeredAddress, businessCategory
 * - Key: ECDSA secp256k1, SHA-256
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { CSR_CONFIG } from "./constants";
import type { CSRInput, CSRResult } from "./types";

// ═══════════════════════════════════════════════════════════
// ASN.1 DER Encoding
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
const derBitString = (data: Buffer) =>
	derWrap(0x03, Buffer.concat([Buffer.from([0x00]), data]));
const derUTF8String = (str: string) =>
	derWrap(0x0c, Buffer.from(str, "utf8"));
const derPrintableString = (str: string) =>
	derWrap(0x13, Buffer.from(str, "ascii"));

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
	// Subject DN attributes
	countryName: "2.5.4.6",
	organizationUnit: "2.5.4.11",
	organization: "2.5.4.10",
	commonName: "2.5.4.3",
	// SubjectAltName dirName attributes
	serialNumber: "2.5.4.5",
	userId: "0.9.2342.19200300.100.1.1",
	title: "2.5.4.12",
	registeredAddress: "2.5.4.26",
	businessCategory: "2.5.4.15",
	// Algorithms
	ecPublicKey: "1.2.840.10045.2.1",
	secp256k1: "1.3.132.0.10",
	ecdsaWithSHA256: "1.2.840.10045.4.3.2",
	// Extensions
	extensionRequest: "1.2.840.113549.1.9.14",
	subjectAltName: "2.5.29.17",
	certificateTemplateName: "1.3.6.1.4.1.311.20.2",
} as const;

// ═══════════════════════════════════════════════════════════
// PEM Helpers
// ═══════════════════════════════════════════════════════════

function toPem(der: Buffer, label: string): string {
	const b64 = der.toString("base64");
	const lines: string[] = [];
	for (let i = 0; i < b64.length; i += 64) {
		lines.push(b64.substring(i, i + 64));
	}
	return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

/** SEC1 EC PRIVATE KEY PEM (compatible with invoice-signer's pemToPrivateKeyHex) */
function buildPrivateKeyPem(
	privBytes: Uint8Array,
	pubUncompressed: Uint8Array,
): string {
	const der = derSequence(
		derInteger(1), // ecPrivkeyVer1
		derOctetString(Buffer.from(privBytes)),
		derContextTag(0, derOID(OID.secp256k1)),
		derContextTag(1, derBitString(Buffer.from(pubUncompressed))),
	);
	return toPem(der, "EC PRIVATE KEY");
}

/** SubjectPublicKeyInfo PEM (compressed point) */
function buildPublicKeyPem(pubCompressed: Uint8Array): string {
	const der = derSequence(
		derSequence(derOID(OID.ecPublicKey), derOID(OID.secp256k1)),
		derBitString(Buffer.from(pubCompressed)),
	);
	return toPem(der, "PUBLIC KEY");
}

// ═══════════════════════════════════════════════════════════
// CSR Generator
// ═══════════════════════════════════════════════════════════

/**
 * Generate an ECDSA secp256k1 key pair + ZATCA-compliant CSR.
 * Pure JavaScript — no OpenSSL CLI, no temp files, works on Vercel.
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	const serialNumber = input.serialNumber || `${Date.now()}`;
	const invoiceType = input.invoiceType ?? "1100";
	const location = input.location || CSR_CONFIG.registeredAddress;
	const industry = input.industry || CSR_CONFIG.businessCategory;

	// 1. Generate ECDSA secp256k1 key pair
	const privateKeyBytes = secp256k1.utils.randomSecretKey();
	const publicKeyUncompressed = secp256k1.getPublicKey(privateKeyBytes, false); // 65 bytes
	const publicKeyCompressed = secp256k1.getPublicKey(privateKeyBytes, true); // 33 bytes

	// 2. Subject DN: C=SA, OU=orgName, O=orgName, CN=MASAR-EGS
	const subject = derSequence(
		derRDN(OID.countryName, derPrintableString(CSR_CONFIG.country)),
		derRDN(OID.organizationUnit, derUTF8String(input.organizationName)),
		derRDN(OID.organization, derUTF8String(input.organizationName)),
		derRDN(OID.commonName, derUTF8String(CSR_CONFIG.commonName)),
	);

	// 3. SubjectPublicKeyInfo (uncompressed point in CSR per X.509 standard)
	const subjectPublicKeyInfo = derSequence(
		derSequence(derOID(OID.ecPublicKey), derOID(OID.secp256k1)),
		derBitString(Buffer.from(publicKeyUncompressed)),
	);

	// 4. Extensions
	// 4a. certificateTemplateName = ZATCA-Code-Signing
	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derPrintableString("ZATCA-Code-Signing")),
	);

	// 4b. subjectAltName dirName (SN, UID, title, registeredAddress, businessCategory)
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

	// 5. Attributes: [0] IMPLICIT SET OF Attribute → extensionRequest
	const attributes = derContextTag(
		0,
		derSequence(
			derOID(OID.extensionRequest),
			derSet(derSequence(certTemplateExt, subjectAltNameExt)),
		),
	);

	// 6. CertificationRequestInfo
	const certRequestInfo = derSequence(
		derInteger(0), // version 0
		subject,
		subjectPublicKeyInfo,
		attributes,
	);

	// 7. Sign CertificationRequestInfo with ECDSA-SHA256
	const hash = sha256(certRequestInfo);
	const signatureDer = Buffer.from(
		secp256k1.sign(hash, privateKeyBytes, { prehash: false, format: "der" }),
	);

	// 8. Complete CertificationRequest
	const csrDer = derSequence(
		certRequestInfo,
		derSequence(derOID(OID.ecdsaWithSHA256)),
		derBitString(signatureDer),
	);

	return {
		csr: csrDer.toString("base64"),
		privateKey: buildPrivateKeyPem(privateKeyBytes, publicKeyUncompressed),
		publicKey: buildPublicKeyPem(publicKeyCompressed),
	};
}
