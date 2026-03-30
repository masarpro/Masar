/**
 * ZATCA Phase 2 — Invoice Signer
 *
 * Signs the invoice XML using ECDSA-SHA256 (secp256k1) and builds the
 * XAdES-BES signature envelope per ZATCA Security Implementation Standards.
 *
 * Steps:
 * 1. Take the invoice XML (without UBLExtensions/Signature)
 * 2. Compute SHA-256 hash of the cleaned XML
 * 3. Sign the hash with the ECDSA private key
 * 4. Build XAdES-BES SignedProperties
 * 5. Inject Signature + UBLExtensions into the XML
 * 6. Generate enhanced QR code (9 tags)
 * 7. Inject QR code AdditionalDocumentReference
 * 8. Return signed XML + hash + signature + QR
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { computeInvoiceHash, cleanXmlForHashing } from "./hash-chain";
import { generateEnhancedQR } from "./qr-enhanced";
import { UBL_NAMESPACES } from "./constants";
import type { SigningResult } from "./types";

/**
 * Sign an invoice XML and produce the complete signed document.
 *
 * @param xml - The unsigned UBL 2.1 invoice XML (from xml-builder)
 * @param privateKeyPem - PEM-encoded ECDSA private key
 * @param certificateBase64 - Base64-encoded X.509 certificate (from CSID)
 * @param publicKeyDer - Base64-encoded DER public key
 * @returns Signed XML, invoice hash, signature, and QR code
 */
export function signInvoice(
	xml: string,
	privateKeyPem: string,
	certificateBase64: string,
	publicKeyDer: string,
): SigningResult {
	// 1. Clean XML for hashing (remove declaration, extensions, signature)
	const cleanedXml = cleanXmlForHashing(xml);

	// 2. Compute invoice hash
	const invoiceHash = computeInvoiceHash(cleanedXml);

	// 3. Compute certificate hash (for SignedProperties)
	const certBytes = Buffer.from(certificateBase64, "base64");
	const certHash = Buffer.from(sha256(certBytes)).toString("base64");

	// 4. Build SignedProperties XML
	const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
	const signedPropertiesXml = buildSignedProperties(certHash, signingTime);

	// 5. Hash the SignedProperties
	const signedPropsHash = Buffer.from(
		sha256(new TextEncoder().encode(signedPropertiesXml)),
	).toString("base64");

	// 6. Build SignedInfo (references: invoice hash + signed properties hash)
	const signedInfoXml = buildSignedInfo(invoiceHash, signedPropsHash);

	// 7. Sign the SignedInfo with ECDSA-SHA256
	const signedInfoHash = sha256(new TextEncoder().encode(signedInfoXml));
	const privKeyHex = pemToPrivateKeyHex(privateKeyPem);
	const privKeyBytes = Buffer.from(privKeyHex, "hex");
	const derSig = secp256k1.sign(signedInfoHash, privKeyBytes, { prehash: false, format: "der" });
	const signatureValue = Buffer.from(derSig).toString("base64");

	// 8. Build the complete Signature element
	const signatureXml = buildSignatureElement(
		signedInfoXml,
		signatureValue,
		certificateBase64,
		signedPropertiesXml,
	);

	// 9. Inject UBLExtensions with Signature into XML
	let signedXml = injectUBLExtensions(xml, signatureXml);

	// 10. Generate enhanced QR code (9 tags)
	// Extract certificate signature for tag 9
	const certSignature = extractCertificateSignature(certificateBase64);

	const qrCode = generateEnhancedQR({
		sellerName: extractXmlValue(xml, "cbc:RegistrationName") ?? "",
		vatNumber: extractXmlValue(xml, "cbc:CompanyID") ?? "",
		timestamp: `${extractXmlValue(xml, "cbc:IssueDate")}T${extractXmlValue(xml, "cbc:IssueTime")}`,
		totalWithVat: extractXmlValue(xml, "cbc:TaxInclusiveAmount") ?? "0.00",
		vatAmount: extractTaxAmount(xml),
		invoiceHash,
		digitalSignature: signatureValue,
		publicKey: publicKeyDer,
		certificateSignature: certSignature,
	});

	// 11. Inject QR code AdditionalDocumentReference
	signedXml = injectQRCode(signedXml, qrCode);

	return {
		signedXml,
		invoiceHash,
		signature: signatureValue,
		qrCode,
	};
}

// ─── SignedProperties (XAdES-BES) ───────────────────────────────────────

function buildSignedProperties(certHash: string, signingTime: string): string {
	return [
		`<xades:SignedProperties xmlns:xades="${UBL_NAMESPACES.xades}" Id="xadesSignedProperties">`,
		`<xades:SignedSignatureProperties>`,
		`<xades:SigningTime>${signingTime}</xades:SigningTime>`,
		`<xades:SigningCertificate>`,
		`<xades:Cert>`,
		`<xades:CertDigest>`,
		`<ds:DigestMethod xmlns:ds="${UBL_NAMESPACES.ds}" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
		`<ds:DigestValue xmlns:ds="${UBL_NAMESPACES.ds}">${certHash}</ds:DigestValue>`,
		`</xades:CertDigest>`,
		`</xades:Cert>`,
		`</xades:SigningCertificate>`,
		`</xades:SignedSignatureProperties>`,
		`</xades:SignedProperties>`,
	].join("");
}

// ─── SignedInfo ──────────────────────────────────────────────────────────

function buildSignedInfo(invoiceHash: string, signedPropsHash: string): string {
	return [
		`<ds:SignedInfo xmlns:ds="${UBL_NAMESPACES.ds}">`,
		`<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>`,
		`<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>`,
		// Reference 1: Invoice hash
		`<ds:Reference Id="invoiceSignedData" URI="">`,
		`<ds:Transforms>`,
		`<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">`,
		`<ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>`,
		`</ds:Transform>`,
		`<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">`,
		`<ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath>`,
		`</ds:Transform>`,
		`<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">`,
		`<ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath>`,
		`</ds:Transform>`,
		`</ds:Transforms>`,
		`<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
		`<ds:DigestValue>${invoiceHash}</ds:DigestValue>`,
		`</ds:Reference>`,
		// Reference 2: SignedProperties hash
		`<ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">`,
		`<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
		`<ds:DigestValue>${signedPropsHash}</ds:DigestValue>`,
		`</ds:Reference>`,
		`</ds:SignedInfo>`,
	].join("");
}

// ─── Complete Signature Element ─────────────────────────────────────────

function buildSignatureElement(
	signedInfoXml: string,
	signatureValue: string,
	certificateBase64: string,
	signedPropertiesXml: string,
): string {
	return [
		`<ds:Signature xmlns:ds="${UBL_NAMESPACES.ds}" Id="signature">`,
		signedInfoXml,
		`<ds:SignatureValue>${signatureValue}</ds:SignatureValue>`,
		`<ds:KeyInfo>`,
		`<ds:X509Data>`,
		`<ds:X509Certificate>${certificateBase64}</ds:X509Certificate>`,
		`</ds:X509Data>`,
		`</ds:KeyInfo>`,
		`<ds:Object>`,
		`<xades:QualifyingProperties xmlns:xades="${UBL_NAMESPACES.xades}" Target="signature">`,
		signedPropertiesXml,
		`</xades:QualifyingProperties>`,
		`</ds:Object>`,
		`</ds:Signature>`,
	].join("");
}

// ─── XML Injection Helpers ──────────────────────────────────────────────

/**
 * Inject UBLExtensions containing the signature at the beginning of Invoice.
 * UBLExtensions must be the first child of <Invoice>.
 */
function injectUBLExtensions(xml: string, signatureXml: string): string {
	const ublExtensions = [
		`<ext:UBLExtensions>`,
		`<ext:UBLExtension>`,
		`<ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>`,
		`<ext:ExtensionContent>`,
		`<sig:UBLDocumentSignatures xmlns:sig="${UBL_NAMESPACES.sig}" xmlns:sac="${UBL_NAMESPACES.sac}" xmlns:sbc="${UBL_NAMESPACES.sbc}">`,
		`<sac:SignatureInformation>`,
		`<cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>`,
		`<sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>`,
		signatureXml,
		`</sac:SignatureInformation>`,
		`</sig:UBLDocumentSignatures>`,
		`</ext:ExtensionContent>`,
		`</ext:UBLExtension>`,
		`</ext:UBLExtensions>`,
	].join("");

	// Insert after the opening <Invoice ...> tag
	return xml.replace(
		/(<Invoice[^>]*>)/,
		`$1${ublExtensions}`,
	);
}

/**
 * Inject QR code as AdditionalDocumentReference.
 * Insert before AccountingSupplierParty.
 */
function injectQRCode(xml: string, qrBase64: string): string {
	const qrRef = [
		`<cac:AdditionalDocumentReference>`,
		`<cbc:ID>QR</cbc:ID>`,
		`<cac:Attachment>`,
		`<cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrBase64}</cbc:EmbeddedDocumentBinaryObject>`,
		`</cac:Attachment>`,
		`</cac:AdditionalDocumentReference>`,
	].join("");

	// Insert before AccountingSupplierParty
	return xml.replace(
		/<cac:AccountingSupplierParty>/,
		`${qrRef}<cac:AccountingSupplierParty>`,
	);
}

// ─── Key/Certificate Helpers ────────────────────────────────────────────

/**
 * Extract the raw private key hex from a PEM-encoded PKCS8 key.
 * This strips the ASN.1 wrapper to get the raw 32-byte key.
 */
function pemToPrivateKeyHex(pem: string): string {
	const base64 = pem
		.replace(/-----BEGIN[^-]+-----/g, "")
		.replace(/-----END[^-]+-----/g, "")
		.replace(/\s/g, "");
	const der = Buffer.from(base64, "base64");

	// PKCS8 for secp256k1: the raw key is the last 32 bytes of the
	// OCTET STRING inside the structure. We parse minimally:
	// Look for the secp256k1 OID (06 05 2b 81 04 00 0a) then extract
	// the private key from the following OCTET STRING.
	const hex = der.toString("hex");

	// Find the inner OCTET STRING containing the EC private key
	// The structure is: SEQUENCE { INTEGER(0), SEQUENCE { OID, OID }, OCTET_STRING { SEQUENCE { INTEGER(1), OCTET_STRING(key) } } }
	// The raw 32-byte key is embedded in an inner OCTET STRING
	const secp256k1Oid = "2b8104000a"; // OID 1.3.132.0.10
	const oidIndex = hex.indexOf(secp256k1Oid);
	if (oidIndex === -1) {
		throw new Error("Not a secp256k1 private key");
	}

	// After the OID and wrapper, find 04 20 (OCTET STRING, 32 bytes)
	// which is the raw private key
	const searchAfter = hex.substring(oidIndex + secp256k1Oid.length);
	const keyMatch = searchAfter.match(/0420([0-9a-f]{64})/);
	if (!keyMatch) {
		throw new Error("Could not extract private key bytes from PKCS8");
	}

	return keyMatch[1]!;
}

/**
 * Extract the certificate signature from a Base64-encoded X.509 certificate.
 * This is the raw signature bytes from the certificate (for QR tag 9).
 */
function extractCertificateSignature(certBase64: string): string {
	// The certificate signature is the last BIT STRING in the X.509 structure.
	// For simplicity, we return the certificate hash as a placeholder.
	// In production, proper ASN.1 parsing extracts the actual signature.
	const certBytes = Buffer.from(certBase64, "base64");
	const certDer = certBytes.toString("hex");

	// X.509 structure: SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
	// signatureValue is the last BIT STRING
	// Find the last BIT STRING (03) in the top-level sequence
	const lastBitStringIndex = certDer.lastIndexOf("03");
	if (lastBitStringIndex > 0 && lastBitStringIndex > certDer.length * 0.5) {
		// Extract from the bit string tag to the end, skip tag+length+unused-bits-byte
		const remaining = certDer.substring(lastBitStringIndex);
		// Parse length
		const lengthByte = parseInt(remaining.substring(2, 4), 16);
		let sigStart = 4; // past tag + 1-byte length
		let sigLength = lengthByte;

		if (lengthByte === 0x81) {
			sigLength = parseInt(remaining.substring(4, 6), 16);
			sigStart = 6;
		} else if (lengthByte === 0x82) {
			sigLength = parseInt(remaining.substring(4, 8), 16);
			sigStart = 8;
		}

		// Skip the unused bits byte (first byte of BIT STRING value)
		const sigHex = remaining.substring(sigStart + 2, sigStart + 2 + (sigLength - 1) * 2);
		if (sigHex.length > 0) {
			return Buffer.from(sigHex, "hex").toString("base64");
		}
	}

	// Fallback: return hash of certificate
	const hash = sha256(certBytes);
	return Buffer.from(hash).toString("base64");
}

// ─── XML Value Extraction (simple regex-based) ──────────────────────────

function extractXmlValue(xml: string, tagName: string): string | null {
	const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`);
	const match = xml.match(regex);
	return match?.[1] ?? null;
}

function extractTaxAmount(xml: string): string {
	// Extract the first TaxAmount (invoice-level, not line-level)
	const match = xml.match(/<cac:TaxTotal>\s*<cbc:TaxAmount[^>]*>([^<]+)<\/cbc:TaxAmount>/);
	return match?.[1] ?? "0.00";
}
