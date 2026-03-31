/**
 * ZATCA Phase 2 — CSR Generator
 *
 * Generates ECDSA secp256k1 key pair + ZATCA-compliant CSR.
 * Uses Node.js crypto for key generation and manual DER/ASN.1 for CSR building.
 * Works on Vercel Serverless — no OpenSSL CLI needed.
 *
 * Based on analysis of the official ZATCA SDK certificate (cert.pem):
 *   Subject DN order: C, O, OU, CN
 *   SAN dirName: SN, UID, title, registeredAddress, businessCategory
 *   Extension: ZATCA-Code-Signing (OID 1.3.6.1.4.1.311.20.2)
 *   Key: ECDSA secp256k1 (OID 1.3.132.0.10)
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

function derContextTag(tag: number, content: Buffer): Buffer {
	const tagByte = 0xa0 | tag;
	return Buffer.concat([
		Buffer.from([tagByte]),
		derLength(content.length),
		content,
	]);
}

function derRDN(oid: string, value: Buffer): Buffer {
	return derSet(derSequence(derOID(oid), value));
}

// ═══════════════════════════════════════════════════════════
// OID Constants
// ═══════════════════════════════════════════════════════════

const OID = {
	countryName: "2.5.4.6",
	organization: "2.5.4.10",
	organizationUnit: "2.5.4.11",
	commonName: "2.5.4.3",
	serialNumber: "2.5.4.5",
	userId: "0.9.2342.19200300.100.1.1",
	title: "2.5.4.12",
	registeredAddress: "2.5.4.26",
	businessCategory: "2.5.4.15",
	ecdsaWithSHA256: "1.2.840.10045.4.3.2",
	extensionRequest: "1.2.840.113549.1.9.14",
	basicConstraints: "2.5.29.19",
	keyUsage: "2.5.29.15",
	subjectAltName: "2.5.29.17",
	certificateTemplateName: "1.3.6.1.4.1.311.20.2",
} as const;

// ═══════════════════════════════════════════════════════════
// CSR Generator
// ═══════════════════════════════════════════════════════════

export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	const serialNumber = input.serialNumber || randomUUID();
	const invoiceType = input.invoiceType ?? "1100";
	const location = input.location || CSR_CONFIG.registeredAddress;
	const industry = input.industry || CSR_CONFIG.businessCategory;
	const env = (process.env.ZATCA_ENVIRONMENT || "sandbox") as ZatcaEnvironment;

	// 1. Generate ECDSA secp256k1 key pair
	const keyPair = generateKeyPairSync("ec", { namedCurve: "secp256k1" });

	const privateKeyPem = keyPair.privateKey.export({
		type: "sec1",
		format: "pem",
	}) as string;

	const publicKeyPem = keyPair.publicKey.export({
		type: "spki",
		format: "pem",
	}) as string;

	const publicKeySpkiDer = keyPair.publicKey.export({
		type: "spki",
		format: "der",
	});

	// 2. Subject DN — order: C, O, OU, CN (per ZATCA SDK cert.pem)
	const cn =
		env === "production"
			? CSR_CONFIG.commonName
			: `TST-886431145-${input.vatNumber}`;
	const asciiOrg =
		input.organizationName.replace(/[^\x20-\x7E]/g, "").trim() ||
		"Masar Platform";
	const ou = input.location || "Main Branch";

	const subject = derSequence(
		derRDN(OID.countryName, derPrintableString("SA")),
		derRDN(OID.organization, derUTF8String(asciiOrg)),
		derRDN(OID.organizationUnit, derUTF8String(ou)),
		derRDN(OID.commonName, derUTF8String(cn)),
	);

	// 3. Extensions

	// 3a. ZATCA-Code-Signing (OID 1.3.6.1.4.1.311.20.2)
	const certTemplateExt = derSequence(
		derOID(OID.certificateTemplateName),
		derOctetString(derUTF8String("ZATCA-Code-Signing")),
	);

	// 3b. subjectAltName with directoryName
	//     SN: "1-<solution>|2-<model>|3-<UUID>"
	const snPrefix = env === "production" ? "1-Masar|2-EGS1|3-" : "1-TST|2-TST|3-";
	const altNameDirName = derSequence(
		derRDN(OID.serialNumber, derUTF8String(`${snPrefix}${serialNumber}`)),
		derRDN(OID.userId, derUTF8String(input.vatNumber)),
		derRDN(OID.title, derUTF8String(invoiceType)),
		derRDN(OID.registeredAddress, derUTF8String(location)),
		derRDN(OID.businessCategory, derUTF8String(industry)),
	);

	const subjectAltNameExt = derSequence(
		derOID(OID.subjectAltName),
		derOctetString(
			derSequence(derContextTag(4, altNameDirName)),
		),
	);

	// 4. Attributes — extensionRequest containing only the two ZATCA-specific extensions
	//    (basicConstraints + keyUsage are implicit per ZATCA SDK behavior)
	const attributes = derContextTag(
		0,
		derSequence(
			derOID(OID.extensionRequest),
			derSet(
				derSequence(
					certTemplateExt,
					subjectAltNameExt,
				),
			),
		),
	);

	// 5. CertificationRequestInfo
	const certRequestInfo = derSequence(
		derInteger(0),
		subject,
		publicKeySpkiDer,
		attributes,
	);

	// 6. Sign with ECDSA-SHA256
	const signer = createSign("SHA256");
	signer.update(certRequestInfo);
	const signatureDer = signer.sign(keyPair.privateKey);

	// 7. Complete CertificationRequest
	const csrDer = derSequence(
		certRequestInfo,
		derSequence(derOID(OID.ecdsaWithSHA256)),
		derBitString(signatureDer),
	);

	// 8. PEM-wrap with 64-char lines, then base64-encode the whole PEM
	const derBase64 = csrDer.toString("base64");
	const wrappedDer = derBase64.replace(/(.{64})/g, "$1\n");
	const pemBody = wrappedDer.endsWith("\n") ? wrappedDer : wrappedDer + "\n";
	const pemString = `-----BEGIN CERTIFICATE REQUEST-----\n${pemBody}-----END CERTIFICATE REQUEST-----\n`;
	const csrBase64 = Buffer.from(pemString).toString("base64");

	console.log("[ZATCA] CSR generated — length:", csrBase64.length, "| CN:", cn);

	return {
		csr: csrBase64,
		privateKey: privateKeyPem,
		publicKey: publicKeyPem,
	};
}
