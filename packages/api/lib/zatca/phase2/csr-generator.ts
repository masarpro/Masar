/**
 * ZATCA Phase 2 — CSR Generator
 *
 * Generates ECDSA secp256k1 key pair + CSR with ZATCA-specific OID extension.
 * Uses node-forge for CSR construction and node:crypto for key generation.
 *
 * CSR is generated once per device during onboarding, so node:crypto is fine
 * (this runs server-side only, not on Edge).
 *
 * Per ZATCA Technical Guidelines Section 4.1:
 * - Key type: ECDSA secp256k1
 * - CSR Subject must include: CN, C, OU, O, SN
 * - Must contain extension OID 2.16.840.1.114513 with invoice type
 */

import forge from "node-forge";
import { generateKeyPairSync } from "node:crypto";
import { CSR_CONFIG, ZATCA_CSR_OID } from "./constants";
import type { CSRInput, CSRResult } from "./types";

/**
 * Generate an ECDSA secp256k1 key pair + ZATCA-compliant CSR.
 *
 * @param input - Organization name, VAT number, invoice type
 * @returns CSR (Base64 DER), private key (PEM), public key (PEM)
 */
export async function generateCSR(input: CSRInput): Promise<CSRResult> {
	// 1. Generate ECDSA key pair (secp256k1)
	const { privateKey, publicKey } = generateKeyPairSync("ec", {
		namedCurve: "secp256k1",
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});

	// 2. Build CSR subject
	const serialNumber = `${CSR_CONFIG.serialNumber}${input.vatNumber}`;
	const invoiceType = input.invoiceType ?? "1100";

	// Convert PEM keys to forge format for CSR construction
	// node-forge doesn't natively support EC keys for CSR signing,
	// so we build the CSR structure manually using forge's ASN.1 utilities
	// and sign it with node:crypto

	const csr = buildZatcaCSR({
		privateKeyPem: privateKey,
		publicKeyPem: publicKey,
		subject: {
			commonName: CSR_CONFIG.commonName,
			country: CSR_CONFIG.country,
			organizationUnit: CSR_CONFIG.organizationUnit,
			organizationName: input.organizationName,
			serialNumber,
		},
		invoiceType,
	});

	return {
		csr,
		privateKey,
		publicKey,
	};
}

interface CSRBuildInput {
	privateKeyPem: string;
	publicKeyPem: string;
	subject: {
		commonName: string;
		country: string;
		organizationUnit: string;
		organizationName: string;
		serialNumber: string;
	};
	invoiceType: string;
}

/**
 * Build a ZATCA-compliant CSR with the custom OID extension.
 * Returns Base64 DER-encoded CSR.
 */
function buildZatcaCSR(input: CSRBuildInput): string {
	// Extract raw public key bytes from PEM for embedding in CSR
	const pubKeyDer = pemToDer(input.publicKeyPem);

	// Build CSR info (the part that gets signed)
	const csrInfo = forge.asn1.create(
		forge.asn1.Class.UNIVERSAL,
		forge.asn1.Type.SEQUENCE,
		true,
		[
			// Version 0
			forge.asn1.create(
				forge.asn1.Class.UNIVERSAL,
				forge.asn1.Type.INTEGER,
				false,
				forge.asn1.integerToDer(0).getBytes(),
			),

			// Subject DN
			buildSubjectDN(input.subject),

			// SubjectPublicKeyInfo (raw DER from node:crypto)
			forge.asn1.fromDer(forge.util.createBuffer(pubKeyDer)),

			// Attributes [0] — contains extension request
			forge.asn1.create(forge.asn1.Class.CONTEXT_SPECIFIC, 0, true, [
				// Extension Request attribute
				forge.asn1.create(
					forge.asn1.Class.UNIVERSAL,
					forge.asn1.Type.SEQUENCE,
					true,
					[
						// OID for extensionRequest (1.2.840.113549.1.9.14)
						forge.asn1.create(
							forge.asn1.Class.UNIVERSAL,
							forge.asn1.Type.OID,
							false,
							forge.asn1.oidToDer("1.2.840.113549.1.9.14").getBytes(),
						),
						// SET of extension sequences
						forge.asn1.create(
							forge.asn1.Class.UNIVERSAL,
							forge.asn1.Type.SET,
							true,
							[
								forge.asn1.create(
									forge.asn1.Class.UNIVERSAL,
									forge.asn1.Type.SEQUENCE,
									true,
									[buildZatcaExtension(input.invoiceType)],
								),
							],
						),
					],
				),
			]),
		],
	);

	// Sign the CSR info with the private key using node:crypto
	const csrInfoDer = forge.asn1.toDer(csrInfo).getBytes();
	const { createSign } = require("node:crypto") as typeof import("node:crypto");
	const signer = createSign("SHA256");
	signer.update(Buffer.from(csrInfoDer, "binary"));
	const signatureBuffer = signer.sign(input.privateKeyPem);

	// Build complete CSR: SEQUENCE { csrInfo, signatureAlgorithm, signature }
	const completeCsr = forge.asn1.create(
		forge.asn1.Class.UNIVERSAL,
		forge.asn1.Type.SEQUENCE,
		true,
		[
			csrInfo,

			// Signature Algorithm: ecdsaWithSHA256 (1.2.840.10045.4.3.2)
			forge.asn1.create(
				forge.asn1.Class.UNIVERSAL,
				forge.asn1.Type.SEQUENCE,
				true,
				[
					forge.asn1.create(
						forge.asn1.Class.UNIVERSAL,
						forge.asn1.Type.OID,
						false,
						forge.asn1.oidToDer("1.2.840.10045.4.3.2").getBytes(),
					),
				],
			),

			// Signature value (BIT STRING)
			forge.asn1.create(
				forge.asn1.Class.UNIVERSAL,
				forge.asn1.Type.BITSTRING,
				false,
				// Prepend 0x00 (no unused bits) to the signature bytes
				String.fromCharCode(0) + signatureBuffer.toString("binary"),
			),
		],
	);

	// Encode to DER and return as Base64
	const derBytes = forge.asn1.toDer(completeCsr).getBytes();
	return forge.util.encode64(derBytes);
}

/**
 * Build Subject Distinguished Name per ZATCA requirements.
 */
function buildSubjectDN(subject: CSRBuildInput["subject"]): forge.asn1.Asn1 {
	const attrs: Array<{ oid: string; value: string; type?: number }> = [
		{ oid: "2.5.4.6", value: subject.country }, // C
		{ oid: "2.5.4.11", value: subject.organizationUnit }, // OU
		{ oid: "2.5.4.10", value: subject.organizationName }, // O
		{ oid: "2.5.4.3", value: subject.commonName }, // CN
		{ oid: "2.5.4.5", value: subject.serialNumber, type: forge.asn1.Type.PRINTABLESTRING }, // SN
	];

	return forge.asn1.create(
		forge.asn1.Class.UNIVERSAL,
		forge.asn1.Type.SEQUENCE,
		true,
		attrs.map((attr) =>
			forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, [
				forge.asn1.create(
					forge.asn1.Class.UNIVERSAL,
					forge.asn1.Type.SEQUENCE,
					true,
					[
						forge.asn1.create(
							forge.asn1.Class.UNIVERSAL,
							forge.asn1.Type.OID,
							false,
							forge.asn1.oidToDer(attr.oid).getBytes(),
						),
						forge.asn1.create(
							forge.asn1.Class.UNIVERSAL,
							attr.type ?? forge.asn1.Type.UTF8,
							false,
							attr.value,
						),
					],
				),
			]),
		),
	);
}

/**
 * Build ZATCA custom extension (OID 2.16.840.1.114513).
 * Contains the invoice type indicator (e.g., "1100").
 */
function buildZatcaExtension(invoiceType: string): forge.asn1.Asn1 {
	return forge.asn1.create(
		forge.asn1.Class.UNIVERSAL,
		forge.asn1.Type.SEQUENCE,
		true,
		[
			// Extension OID
			forge.asn1.create(
				forge.asn1.Class.UNIVERSAL,
				forge.asn1.Type.OID,
				false,
				forge.asn1.oidToDer(ZATCA_CSR_OID).getBytes(),
			),
			// Extension value (OCTET STRING wrapping UTF8String)
			forge.asn1.create(
				forge.asn1.Class.UNIVERSAL,
				forge.asn1.Type.OCTETSTRING,
				false,
				forge.asn1.toDer(
					forge.asn1.create(
						forge.asn1.Class.UNIVERSAL,
						forge.asn1.Type.UTF8,
						false,
						invoiceType,
					),
				).getBytes(),
			),
		],
	);
}

/** Convert PEM to raw DER bytes (binary string). */
function pemToDer(pem: string): string {
	const base64 = pem
		.replace(/-----BEGIN[^-]+-----/g, "")
		.replace(/-----END[^-]+-----/g, "")
		.replace(/\s/g, "");
	return forge.util.decode64(base64);
}
