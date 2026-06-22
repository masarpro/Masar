import { config } from "@repo/config";

/**
 * Resolve a stored image reference to a fetchable URL.
 *
 * Logos and uploaded images are persisted in the DB as bare S3 keys
 * (e.g. "org123.png" or "finance-logo-org123.png"). A bare filename can't be
 * rendered directly in an <img>/<Image> — it must go through `/image-proxy`,
 * which mints a fresh signed S3 URL on every request (S3 signed URLs expire).
 *
 * Pass-through cases (already renderable, returned unchanged):
 * - full URLs (http/https)
 * - inline base64 data URIs (data:)
 * - already-rooted app paths (/...)
 *
 * @param ref stored reference (S3 key, URL, or data URI)
 * @param bucket storage bucket the key lives in (defaults to avatars)
 */
export function resolveImageSrc(
	ref?: string | null,
	bucket: string = config.storage.bucketNames.avatars,
): string | undefined {
	if (!ref) return undefined;
	if (
		ref.startsWith("http") ||
		ref.startsWith("data:") ||
		ref.startsWith("/")
	) {
		return ref;
	}
	return `/image-proxy/${bucket}/${ref}`;
}
