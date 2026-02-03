import { encodeZatcaTLV, type ZatcaTLVData } from "./tlv-encoder";

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
	// In Node.js
	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}

	// In browser
	let binary = "";
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Format a number as a decimal string with 2 decimal places
 */
function formatAmount(amount: number): string {
	return amount.toFixed(2);
}

/**
 * Format a date to ISO 8601 format (ZATCA compliant)
 * Format: YYYY-MM-DDTHH:mm:ssZ
 */
function formatDateTime(date: Date): string {
	return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export interface ZatcaQRInput {
	/** اسم البائع/الشركة */
	sellerName: string;
	/** الرقم الضريبي للبائع (يجب أن يكون 15 رقم) */
	vatNumber: string;
	/** تاريخ ووقت الفاتورة */
	timestamp: Date;
	/** إجمالي الفاتورة شامل الضريبة */
	totalWithVat: number;
	/** مبلغ ضريبة القيمة المضافة */
	vatAmount: number;
}

/**
 * Generate ZATCA compliant QR Code content (Base64 encoded TLV)
 *
 * This generates a Base64 encoded TLV string that can be used
 * to generate a QR code for ZATCA Phase 1 compliance.
 *
 * @example
 * ```typescript
 * const qrContent = generateZatcaQR({
 *   sellerName: "شركة مسار للمقاولات",
 *   vatNumber: "310122393500003",
 *   timestamp: new Date(),
 *   totalWithVat: 1150.00,
 *   vatAmount: 150.00,
 * });
 *
 * // Use qrContent with a QR code library like 'qrcode'
 * // import QRCode from 'qrcode';
 * // const qrImage = await QRCode.toDataURL(qrContent);
 * ```
 */
export function generateZatcaQR(input: ZatcaQRInput): string {
	// Validate VAT number (should be 15 digits)
	if (!/^\d{15}$/.test(input.vatNumber)) {
		throw new Error("VAT number must be exactly 15 digits");
	}

	const tlvData: ZatcaTLVData = {
		sellerName: input.sellerName,
		vatNumber: input.vatNumber,
		timestamp: formatDateTime(input.timestamp),
		totalWithVat: formatAmount(input.totalWithVat),
		vatAmount: formatAmount(input.vatAmount),
	};

	const tlvBytes = encodeZatcaTLV(tlvData);
	return uint8ArrayToBase64(tlvBytes);
}

/**
 * Validate a ZATCA QR content
 * Returns the decoded data if valid, throws if invalid
 */
export function validateZatcaQR(base64Content: string): ZatcaTLVData {
	// Decode Base64
	let bytes: Uint8Array;

	if (typeof Buffer !== "undefined") {
		bytes = new Uint8Array(Buffer.from(base64Content, "base64"));
	} else {
		const binary = atob(base64Content);
		bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
	}

	// Try to decode TLV
	const { decodeZatcaTLV } = require("./tlv-encoder");
	const data = decodeZatcaTLV(bytes);

	// Validate required fields
	if (!data.sellerName) throw new Error("Missing seller name");
	if (!data.vatNumber) throw new Error("Missing VAT number");
	if (!data.timestamp) throw new Error("Missing timestamp");
	if (!data.totalWithVat) throw new Error("Missing total with VAT");
	if (!data.vatAmount) throw new Error("Missing VAT amount");

	// Validate VAT number format
	if (!/^\d{15}$/.test(data.vatNumber)) {
		throw new Error("Invalid VAT number format");
	}

	return data;
}
