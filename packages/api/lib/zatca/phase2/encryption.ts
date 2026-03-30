/**
 * AES-256-GCM encryption for ZATCA private keys stored in DB.
 * Uses ZATCA_DEVICE_ENCRYPTION_KEY from environment variables.
 *
 * Format: iv:tag:encrypted (all Base64)
 * Never store private keys or CSID secrets in plaintext.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
	const key = process.env.ZATCA_DEVICE_ENCRYPTION_KEY;
	if (!key) {
		throw new Error("ZATCA_DEVICE_ENCRYPTION_KEY is not set");
	}
	// Accept 64 hex chars or 44 Base64 chars (both = 32 bytes)
	if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
		return Buffer.from(key, "hex");
	}
	const buf = Buffer.from(key, "base64");
	if (buf.length !== 32) {
		throw new Error(
			"ZATCA_DEVICE_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 Base64 chars)",
		);
	}
	return buf;
}

/** Encrypt a plaintext string. Returns "iv:tag:encrypted" (Base64). */
export function encryptSecret(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(plaintext, "utf8", "base64");
	encrypted += cipher.final("base64");

	const tag = cipher.getAuthTag();

	return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/** Decrypt a ciphertext string in "iv:tag:encrypted" format. */
export function decryptSecret(ciphertext: string): string {
	const key = getEncryptionKey();
	const parts = ciphertext.split(":");

	if (parts.length !== 3) {
		throw new Error("Invalid encrypted format — expected iv:tag:encrypted");
	}

	const [ivB64, tagB64, encryptedB64] = parts;
	const iv = Buffer.from(ivB64!, "base64");
	const tag = Buffer.from(tagB64!, "base64");
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);

	let decrypted = decipher.update(encryptedB64!, "base64", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
}
