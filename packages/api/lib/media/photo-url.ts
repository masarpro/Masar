const ATTACHMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

/**
 * ProjectPhoto.url historically stored short-lived signed storage URLs, and
 * later absolute /image-proxy URLs bound to whatever origin performed the
 * upload (localhost, preview deployments, ...). Both break over time: signed
 * URLs expire and stale origins 404, so covers silently fall back to
 * gradients in the UI.
 *
 * Normalize any stored value to the stable, origin-relative proxy path
 * (/image-proxy/<bucket>/<key>) that never expires. Unknown formats are
 * returned untouched.
 */
export function normalizePhotoUrl(
	url: string | null | undefined,
): string | null {
	if (!url) {
		return null;
	}

	if (url.startsWith("/image-proxy/")) {
		return url;
	}

	let pathname: string;
	try {
		pathname = new URL(url).pathname;
	} catch {
		// Relative non-proxy path — nothing safe to rewrite.
		return url;
	}

	const proxyIdx = pathname.indexOf("/image-proxy/");
	if (proxyIdx !== -1) {
		return pathname.slice(proxyIdx);
	}

	// Signed storage URL (e.g. Supabase S3 /storage/v1/s3/<bucket>/<key>?X-Amz-…
	// or /storage/v1/object/sign/<bucket>/<key>?token=…): extract the key after
	// the bucket segment and rebuild the canonical proxy path.
	const segments = pathname.split("/").filter(Boolean);
	const bucketIdx = segments.indexOf(ATTACHMENTS_BUCKET);
	if (bucketIdx !== -1 && bucketIdx < segments.length - 1) {
		const key = segments.slice(bucketIdx + 1).join("/");
		return `/image-proxy/${ATTACHMENTS_BUCKET}/${key}`;
	}

	return url;
}

/**
 * Normalize the url field on a photo-like record (or null) in place-safe way.
 */
export function normalizePhotoRecord<T extends { url: string }>(
	photo: T | null | undefined,
): T | null {
	if (!photo) {
		return null;
	}
	return { ...photo, url: normalizePhotoUrl(photo.url) ?? photo.url };
}
