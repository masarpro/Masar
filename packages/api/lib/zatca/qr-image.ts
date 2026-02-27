import QRCode from "qrcode";

/**
 * Convert a ZATCA TLV Base64 string into a QR code Data URL (PNG).
 *
 * The resulting string is a complete `data:image/png;base64,...` URL
 * that can be stored in the database and rendered directly in an `<img>` tag.
 */
export async function generateZatcaQRImage(tlvBase64: string): Promise<string> {
	return QRCode.toDataURL(tlvBase64, {
		errorCorrectionLevel: "M",
		margin: 1,
		width: 200,
		color: {
			dark: "#000000",
			light: "#FFFFFF",
		},
	});
}
