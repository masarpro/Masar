import QRCode from "qrcode";

/**
 * Convert a ZATCA TLV Base64 string into a QR code Data URL (PNG).
 *
 * The resulting string is a complete `data:image/png;base64,...` URL
 * that can be stored in the database and rendered directly in an `<img>` tag.
 *
 * Rendering parameters tuned for ZATCA Phase 2 (9 tags, ~570 base64 chars):
 *  - margin: 4 modules — the QR/ISO 18004 minimum quiet zone. With margin=1
 *    the finder patterns touch the image edge and most scanners (incl. the
 *    official ZATCA verifier) can't lock onto the matrix.
 *  - width: 400 px — gives ~7-8 px per module for Phase 2 (33-37 modules per
 *    side). At width=200 the modules were ~5 px and scanning failed.
 *  - errorCorrectionLevel "M" — 15% recovery, ZATCA-recommended.
 */
export async function generateZatcaQRImage(tlvBase64: string): Promise<string> {
	return QRCode.toDataURL(tlvBase64, {
		errorCorrectionLevel: "M",
		// margin 5 (one above the 4-module spec floor) gives a measurable
		// safety buffer: with `qrcode`'s rounding behavior on a 400-px target,
		// a literal margin=4 produced ~3.2 modules of measurable quiet zone in
		// our pixel walker. Margin=5 cleanly clears the 4-module bar.
		margin: 5,
		width: 400,
		color: {
			dark: "#000000",
			light: "#FFFFFF",
		},
	});
}
