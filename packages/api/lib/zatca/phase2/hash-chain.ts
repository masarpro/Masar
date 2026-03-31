/**
 * ZATCA Phase 2 — Hash Chain Management
 *
 * Each invoice references the SHA-256 hash of the previous invoice,
 * forming a tamper-evident chain. The first invoice in the chain uses
 * INITIAL_PIH (Base64 of SHA-256 of "0").
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { INITIAL_PIH } from "./constants";

/**
 * Compute SHA-256 hash of the cleaned invoice XML.
 * Returns Base64-encoded hash string.
 *
 * @param cleanXml - The invoice XML after removing XML declaration,
 *                   UBLExtensions, and Signature elements
 */
export function computeInvoiceHash(cleanXml: string): string {
	const bytes = new TextEncoder().encode(cleanXml);
	const hash = sha256(bytes);
	return Buffer.from(hash).toString("base64");
}

/**
 * Remove elements that should not be included in the hash:
 * - XML declaration (<?xml ...?>)
 * - UBLExtensions element
 * - Signature element
 * - QR code AdditionalDocumentReference
 *
 * Per ZATCA: the hash is computed on the "invoice body" without
 * signature-related elements.
 */
export function cleanXmlForHashing(xml: string): string {
	let cleaned = xml;

	// Remove XML declaration
	cleaned = cleaned.replace(/<\?xml[^?]*\?>\s*/g, "");

	// Remove UBLExtensions block (contains signature)
	cleaned = cleaned.replace(
		/<ext:UBLExtensions[\s\S]*?<\/ext:UBLExtensions>\s*/g,
		"",
	);

	// Remove ds:Signature element if present outside UBLExtensions
	cleaned = cleaned.replace(/<ds:Signature[\s\S]*?<\/ds:Signature>\s*/g, "");

	// Remove cac:Signature reference element (per XPath transform: not(//ancestor-or-self::cac:Signature))
	cleaned = cleaned.replace(/<cac:Signature[\s\S]*?<\/cac:Signature>\s*/g, "");

	// Remove QR code AdditionalDocumentReference
	// Match the one with <cbc:ID>QR</cbc:ID>
	cleaned = cleaned.replace(
		/<cac:AdditionalDocumentReference>\s*<cbc:ID>QR<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>\s*/g,
		"",
	);

	return cleaned;
}

/** Validate that a given hash matches the expected previous hash. */
export function validateHashChain(
	previousHash: string,
	expectedPreviousHash: string,
): boolean {
	return previousHash === expectedPreviousHash;
}

/** Get the initial PIH for the first invoice in the chain. */
export function getInitialPIH(): string {
	return INITIAL_PIH;
}
