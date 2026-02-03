/**
 * ZATCA (هيئة الزكاة والضريبة والجمارك) QR Code Generation
 *
 * This module provides utilities for generating ZATCA-compliant
 * QR codes for Saudi Arabian tax invoices (Phase 1).
 *
 * ZATCA Phase 1 Requirements:
 * - QR code must contain TLV (Tag-Length-Value) encoded data
 * - Required fields: Seller Name, VAT Number, Timestamp, Total, VAT Amount
 * - QR code content must be Base64 encoded
 *
 * @example
 * ```typescript
 * import { generateZatcaQR } from "@repo/api/lib/zatca";
 *
 * const qrContent = generateZatcaQR({
 *   sellerName: "شركة مسار للمقاولات",
 *   vatNumber: "310122393500003",
 *   timestamp: new Date(),
 *   totalWithVat: 1150.00,
 *   vatAmount: 150.00,
 * });
 * ```
 */

export { generateZatcaQR, validateZatcaQR, type ZatcaQRInput } from "./qr-generator";
export { encodeZatcaTLV, decodeZatcaTLV, type ZatcaTLVData } from "./tlv-encoder";
