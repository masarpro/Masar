/**
 * ZATCA Phase 2 — Enhanced QR Code (9 Tags)
 *
 * Phase 1 QR has 5 TLV tags (seller, VAT, timestamp, total, VAT amount).
 * Phase 2 adds 4 more tags (6-9) for cryptographic verification:
 *   Tag 6: SHA-256 hash of invoice XML
 *   Tag 7: ECDSA digital signature
 *   Tag 8: ECDSA public key (DER encoded)
 *   Tag 9: Certificate signature (CSID stamp)
 *
 * Tags 6-9 are binary data, not UTF-8 strings, so we need a new
 * TLV encoder that supports binary values and multi-byte lengths
 * (binary values can exceed 255 bytes).
 *
 * We do NOT modify the existing tlv-encoder.ts — Phase 1 stays untouched.
 */

import type { EnhancedQRInput } from "./types";

/**
 * Generate a ZATCA Phase 2 enhanced QR code content (Base64 TLV, 9 tags).
 *
 * @returns Base64-encoded TLV string suitable for QR code generation
 */
export function generateEnhancedQR(input: EnhancedQRInput): string {
	const fields: Uint8Array[] = [
		// Tags 1-5: text values (UTF-8)
		encodeTLVText(1, input.sellerName),
		encodeTLVText(2, input.vatNumber),
		encodeTLVText(3, input.timestamp),
		encodeTLVText(4, input.totalWithVat),
		encodeTLVText(5, input.vatAmount),
		// Tags 6 & 7: per ZATCA spec (and zatca-xml-js reference impl), the hash
		// and signature are carried as the base64 STRING itself — encoded as
		// UTF-8 bytes — NOT base64-decoded to raw binary. The verifier app
		// re-decodes them inside the QR before doing ECDSA-verify.
		// Reference: node_modules/zatca-xml-js/lib/zatca/qr/index.js (TLV()
		// calls Buffer.from(tag) on a base64 string → UTF-8 bytes).
		// Verified by scripts/zatca/verify-qr-against-zatca-spec.ts.
		encodeTLVBinary(6, Buffer.from(input.invoiceHash)),
		encodeTLVBinary(7, Buffer.from(input.digitalSignature)),
		// Tags 8 & 9: raw DER bytes (the inputs are base64 of DER, so we DO
		// decode them here to get the binary form the spec expects).
		encodeTLVBinary(8, Buffer.from(input.publicKey, "base64")),
		encodeTLVBinary(9, Buffer.from(input.certificateSignature, "base64")),
	];

	const totalLength = fields.reduce((sum, f) => sum + f.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const field of fields) {
		result.set(field, offset);
		offset += field.length;
	}

	return Buffer.from(result).toString("base64");
}

/**
 * Encode a TLV field with a UTF-8 text value.
 * Supports multi-byte length encoding for values > 127 bytes.
 */
function encodeTLVText(tag: number, value: string): Uint8Array {
	const valueBytes = new TextEncoder().encode(value);
	return encodeTLVBinary(tag, valueBytes);
}

/**
 * Encode a TLV field with raw binary value.
 *
 * ZATCA TLV uses a single length byte (0-255), exactly like the Phase 1
 * encoder (tlv-encoder.ts) and the zatca-xml-js reference impl — NOT ASN.1
 * DER length encoding. Using the ASN.1 0x81 prefix for 128-255 byte values
 * (as a previous version did) corrupts the TLV for the verifier whenever a
 * field exceeds 127 bytes (e.g. a long Arabic seller name in Tag 1 = 64+
 * Arabic chars at 2 bytes each).
 */
function encodeTLVBinary(tag: number, value: Uint8Array): Uint8Array {
	if (value.length > 255) {
		throw new Error(
			`ZATCA TLV value for tag ${tag} exceeds 255 bytes (${value.length})`,
		);
	}
	const result = new Uint8Array(2 + value.length);
	result[0] = tag;
	result[1] = value.length;
	result.set(value, 2);
	return result;
}
