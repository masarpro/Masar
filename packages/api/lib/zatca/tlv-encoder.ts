/**
 * TLV (Tag-Length-Value) Encoder for ZATCA QR Code
 * Based on ZATCA Phase 1 requirements
 *
 * ZATCA QR Code TLV Tags:
 * 1 - Seller Name (اسم البائع)
 * 2 - VAT Registration Number (الرقم الضريبي)
 * 3 - Invoice Date/Time (تاريخ ووقت الفاتورة)
 * 4 - Invoice Total (with VAT) (إجمالي الفاتورة شامل الضريبة)
 * 5 - VAT Total (مجموع ضريبة القيمة المضافة)
 */

/**
 * Encode a single TLV field
 */
function encodeTLV(tag: number, value: string): Uint8Array {
	const valueBytes = new TextEncoder().encode(value);
	const length = valueBytes.length;

	const result = new Uint8Array(2 + length);
	result[0] = tag;
	result[1] = length;
	result.set(valueBytes, 2);

	return result;
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatenateArrays(...arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);

	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}

	return result;
}

export interface ZatcaTLVData {
	/** اسم البائع */
	sellerName: string;
	/** الرقم الضريبي للبائع (15 أرقام) */
	vatNumber: string;
	/** تاريخ ووقت الفاتورة (ISO 8601) */
	timestamp: string;
	/** إجمالي الفاتورة شامل الضريبة */
	totalWithVat: string;
	/** مبلغ الضريبة */
	vatAmount: string;
}

/**
 * Encode ZATCA data to TLV format
 * Returns a Uint8Array of TLV encoded data
 */
export function encodeZatcaTLV(data: ZatcaTLVData): Uint8Array {
	const field1 = encodeTLV(1, data.sellerName);
	const field2 = encodeTLV(2, data.vatNumber);
	const field3 = encodeTLV(3, data.timestamp);
	const field4 = encodeTLV(4, data.totalWithVat);
	const field5 = encodeTLV(5, data.vatAmount);

	return concatenateArrays(field1, field2, field3, field4, field5);
}

/**
 * Decode TLV data back to structured format
 * Useful for verification
 */
export function decodeZatcaTLV(data: Uint8Array): ZatcaTLVData {
	const result: Partial<ZatcaTLVData> = {};
	let offset = 0;

	while (offset < data.length) {
		const tag = data[offset];
		const length = data[offset + 1];
		const value = new TextDecoder().decode(
			data.slice(offset + 2, offset + 2 + length),
		);

		switch (tag) {
			case 1:
				result.sellerName = value;
				break;
			case 2:
				result.vatNumber = value;
				break;
			case 3:
				result.timestamp = value;
				break;
			case 4:
				result.totalWithVat = value;
				break;
			case 5:
				result.vatAmount = value;
				break;
		}

		offset += 2 + length;
	}

	return result as ZatcaTLVData;
}
