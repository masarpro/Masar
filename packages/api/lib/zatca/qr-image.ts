import QRCode from "qrcode";

/**
 * Convert a ZATCA TLV Base64 string into a QR code Data URL (PNG).
 *
 * The resulting string is a complete `data:image/png;base64,...` URL
 * that can be stored in the database and rendered directly in an `<img>` tag.
 *
 * Rendering parameters tuned for ZATCA Phase 2 (9 tags, ~520 base64 chars):
 *  - margin: 5 modules — above the QR/ISO 18004 4-module minimum quiet zone.
 *    With too small a quiet zone the finder patterns touch the image edge and
 *    most scanners (incl. the official ZATCA verifier) can't lock onto the
 *    matrix.
 *  - errorCorrectionLevel "L" — 7% recovery. EC level is NOT part of the TLV
 *    content ZATCA verifies (verification runs on the decoded payload, not the
 *    matrix), so lowering M→L is spec-safe. The Phase 2 payload (~520 base64
 *    chars) renders as ~V12 (65 modules/side) at L versus ~V15 (77 modules) at
 *    M — ~30% larger modules at the same physical size, which is what makes the
 *    dense Phase 2 code scannable on screen and on paper.
 *  - width: 600 px — a crisp source so the larger on-screen / print display
 *    sizes (see QRCodeElement.tsx) don't upscale-blur the matrix.
 */
export async function generateZatcaQRImage(tlvBase64: string): Promise<string> {
	return QRCode.toDataURL(tlvBase64, {
		errorCorrectionLevel: "L",
		margin: 5,
		width: 600,
		color: {
			dark: "#000000",
			light: "#FFFFFF",
		},
	});
}
