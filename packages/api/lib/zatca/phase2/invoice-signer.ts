/**
 * ZATCA Phase 2 — Invoice Signer
 *
 * Signs the invoice XML using ECDSA-SHA256 and builds the
 * XAdES-BES signature envelope per ZATCA Security Implementation Standards.
 *
 * Steps:
 * 1. Take the invoice XML (without UBLExtensions/Signature)
 * 2. Compute SHA-256 hash of the cleaned XML
 * 3. Sign the hash with the ECDSA private key
 * 4. Build XAdES-BES SignedProperties (with IssuerSerial)
 * 5. Inject Signature + UBLExtensions into the XML
 * 6. Generate enhanced QR code (9 tags)
 * 7. Inject QR code AdditionalDocumentReference
 * 8. Return signed XML + hash + signature + QR
 */

import { createHash, createPrivateKey, createSign, X509Certificate } from "node:crypto";
import { computeInvoiceHash, cleanXmlForHashing } from "./hash-chain";
import { generateEnhancedQR } from "./qr-enhanced";
import { UBL_NAMESPACES } from "./constants";
import type { SigningResult } from "./types";

/**
 * Sign an invoice XML and produce the complete signed document.
 */
export function signInvoice(
	xml: string,
	privateKeyPem: string,
	certificateBase64: string,
	publicKeyDer: string,
): SigningResult {
	// 1. Clean XML for hashing
	const cleanedXml = cleanXmlForHashing(xml);

	// 2. Compute invoice hash
	const invoiceHash = computeInvoiceHash(cleanedXml);

	// 3. Decode binarySecurityToken: base64 → PEM body → DER
	//    binarySecurityToken from ZATCA is base64( base64(DER) )
	//    First decode: get PEM body string ("MIICLDCCAdOg...")
	//    Second decode: get raw DER bytes for hashing
	const pemBody = Buffer.from(certificateBase64, "base64").toString("utf-8")
		.replace(/-----BEGIN CERTIFICATE-----/g, "")
		.replace(/-----END CERTIFICATE-----/g, "")
		.replace(/\s/g, "");
	const certDerBytes = Buffer.from(pemBody, "base64");
	const certHash = createHash("sha256").update(certDerBytes).digest("base64");

	// 4. Extract issuer and serial from certificate
	const { issuer: issuerDN, serial: serialNumberDec } = getCertInfo(pemBody);

	// 5. Build SignedProperties XML (with IssuerSerial)
	const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
	const signedPropertiesXml = buildSignedProperties(certHash, signingTime, issuerDN, serialNumberDec);

	// 6. Hash the SignedProperties (C14N form: inherited namespaces added alphabetically)
	const spForHashing = signedPropertiesXml.replace(
		'<xades:SignedProperties Id="xadesSignedProperties">',
		`<xades:SignedProperties xmlns:ds="${UBL_NAMESPACES.ds}" xmlns:xades="${UBL_NAMESPACES.xades}" Id="xadesSignedProperties">`,
	);
	const signedPropsHash = createHash("sha256")
		.update(spForHashing)
		.digest("base64");

	// DEBUG — hash diagnostics
	console.log("[ZATCA Sign] X509Cert in XML (first 50):", pemBody.substring(0, 50));
	console.log("[ZATCA Sign] certDER length:", certDerBytes.length, "bytes | certHash:", certHash);
	console.log("[ZATCA Sign] issuer:", issuerDN, "| serial:", serialNumberDec);
	console.log("[ZATCA Sign] SP hash input length:", signedPropertiesXml.length, "| SP hash:", signedPropsHash);
	console.log("[ZATCA Sign] invoiceHash:", invoiceHash);

	// 7. Build SignedInfo
	const signedInfoXml = buildSignedInfo(invoiceHash, signedPropsHash);

	// 8. Sign the SignedInfo with ECDSA-SHA256 using Node.js crypto
	const signer = createSign("SHA256");
	signer.update(signedInfoXml);
	const privKey = createPrivateKey(privateKeyPem);
	const signatureValue = signer.sign(privKey, "base64");

	// 9. Build the complete Signature element
	const signatureXml = buildSignatureElement(
		signedInfoXml,
		signatureValue,
		pemBody,
		signedPropertiesXml,
	);

	// 10. Inject UBLExtensions with Signature into XML
	let signedXml = injectUBLExtensions(xml, signatureXml);

	// 11. Generate enhanced QR code (9 tags)
	const certSignature = extractCertificateSignature(certDerBytes);

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

	// 12. Inject QR code AdditionalDocumentReference
	signedXml = injectQRCode(signedXml, qrCode);

	return {
		signedXml,
		invoiceHash,
		signature: signatureValue,
		qrCode,
	};
}

// ─── SignedProperties (XAdES-BES) with IssuerSerial ────────────────────

function buildSignedProperties(
	certHash: string,
	signingTime: string,
	issuerDN: string,
	serialNumber: string,
): string {
	// For embedding in XML: no xmlns declarations (inherited from ancestors
	// ds:Signature and xades:QualifyingProperties)
	return [
		`<xades:SignedProperties Id="xadesSignedProperties">`,
		`<xades:SignedSignatureProperties>`,
		`<xades:SigningTime>${signingTime}</xades:SigningTime>`,
		`<xades:SigningCertificate>`,
		`<xades:Cert>`,
		`<xades:CertDigest>`,
		`<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
		`<ds:DigestValue>${certHash}</ds:DigestValue>`,
		`</xades:CertDigest>`,
		`<xades:IssuerSerial>`,
		`<ds:X509IssuerName>${escapeXml(issuerDN)}</ds:X509IssuerName>`,
		`<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>`,
		`</xades:IssuerSerial>`,
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

	return xml.replace(/(<Invoice[^>]*>)/, `$1${ublExtensions}`);
}

function injectQRCode(xml: string, qrBase64: string): string {
	const qrRef = [
		`<cac:AdditionalDocumentReference>`,
		`<cbc:ID>QR</cbc:ID>`,
		`<cac:Attachment>`,
		`<cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrBase64}</cbc:EmbeddedDocumentBinaryObject>`,
		`</cac:Attachment>`,
		`</cac:AdditionalDocumentReference>`,
	].join("");

	// Insert before cac:Signature (QR must come before Signature per UBL 2.1 order)
	return xml.replace(/<cac:Signature>/, `${qrRef}<cac:Signature>`);
}

// ─── Certificate Helpers ────────────────────────────────────────────────

function extractCertificateSignature(certDerBytes: Buffer): string {
	const hex = certDerBytes.toString("hex");
	// X.509: SEQUENCE { tbsCertificate, sigAlgorithm, signatureValue(BIT STRING) }
	// Find the last BIT STRING (tag 03) in the second half of the cert
	const halfPoint = Math.floor(hex.length / 2);
	let searchFrom = halfPoint;
	let lastIdx = -1;
	while (true) {
		const idx = hex.indexOf("03", searchFrom);
		if (idx === -1) break;
		lastIdx = idx;
		searchFrom = idx + 2;
	}

	if (lastIdx > 0) {
		const remaining = hex.substring(lastIdx);
		const lenByte = parseInt(remaining.substring(2, 4), 16);
		let sigStart = 4;
		let sigLength = lenByte;
		if (lenByte === 0x81) { sigLength = parseInt(remaining.substring(4, 6), 16); sigStart = 6; }
		else if (lenByte === 0x82) { sigLength = parseInt(remaining.substring(4, 8), 16); sigStart = 8; }
		// Skip unused bits byte
		const sigHex = remaining.substring(sigStart + 2, sigStart + 2 + (sigLength - 1) * 2);
		if (sigHex.length > 0) {
			return Buffer.from(sigHex, "hex").toString("base64");
		}
	}

	// Fallback
	return createHash("sha256").update(certDerBytes).digest("base64");
}

// ─── Utility ────────────────────────────────────────────────────────────

function extractXmlValue(xml: string, tagName: string): string | null {
	const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`);
	return xml.match(regex)?.[1] ?? null;
}

function extractTaxAmount(xml: string): string {
	const match = xml.match(/<cac:TaxTotal>\s*<cbc:TaxAmount[^>]*>([^<]+)<\/cbc:TaxAmount>/);
	return match?.[1] ?? "0.00";
}

function escapeXml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Certificate Info via OpenSSL ──────────────────────────────────────

/** Parse cert info. pemBody = base64 of DER (the PEM body without headers). */
function getCertInfo(pemBody: string): { issuer: string; serial: string } {
	// Wrap in PEM headers for X509Certificate
	const pem = `-----BEGIN CERTIFICATE-----\n${pemBody}\n-----END CERTIFICATE-----`;
	try {
		const x509 = new X509Certificate(pem);
		const serial = BigInt("0x" + x509.serialNumber).toString(10);
		console.log("[ZATCA Sign] cert issuer:", x509.issuer);
		console.log("[ZATCA Sign] cert serial:", serial);
		return { issuer: x509.issuer, serial };
	} catch (e) {
		console.error("[ZATCA Sign] X509 parse failed:", (e as Error).message);
		console.error("[ZATCA Sign] pemBody first 50:", pemBody.substring(0, 50));
		return { issuer: "CN=Unknown", serial: "0" };
	}
}
