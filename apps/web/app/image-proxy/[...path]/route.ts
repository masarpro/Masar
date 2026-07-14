import { config } from "@repo/config";
import { db } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { getSession } from "@saas/auth/lib/server";
import { NextResponse } from "next/server";

// Map file extensions to a Content-Type. Videos are streamed through this route
// (see below) so they play inline with correct type + range support, even though
// the storage backend (Supabase S3) doesn't reliably honor response-* overrides.
const VIDEO_CONTENT_TYPE_BY_EXT: Record<string, string> = {
	mp4: "video/mp4",
	webm: "video/webm",
	mov: "video/quicktime",
	m4v: "video/x-m4v",
	ogg: "video/ogg",
};

// Headers worth forwarding from the upstream storage response when streaming.
const PASSTHROUGH_HEADERS = [
	"content-length",
	"content-range",
	"accept-ranges",
	"etag",
	"last-modified",
];

// Object keys in the attachments bucket are shaped like
// "<prefix>/<orgId>/…" (attachments/…, documents/…, leads/…). The org id is
// always the second path segment for these prefixes.
const ORG_SCOPED_PREFIXES = new Set(["attachments", "documents", "leads"]);

function extractOrgId(filePath: string): string | null {
	const segments = filePath.split("/");
	if (segments.length >= 2 && ORG_SCOPED_PREFIXES.has(segments[0])) {
		return segments[1];
	}
	return null;
}

// Short-lived membership cache so a page rendering many images doesn't issue one
// DB query per <img>. Per-instance + 60s TTL — safe for serverless.
const membershipCache = new Map<string, { ok: boolean; exp: number }>();

async function isOrgMember(userId: string, orgId: string): Promise<boolean> {
	const key = `${userId}:${orgId}`;
	const now = Date.now();
	const cached = membershipCache.get(key);
	if (cached && cached.exp > now) {
		return cached.ok;
	}
	const member = await db.member.findFirst({
		where: { userId, organizationId: orgId },
		select: { id: true },
	});
	const ok = !!member;
	membershipCache.set(key, { ok, exp: now + 60_000 });
	return ok;
}

// Project photos are intentionally shareable through the owner portal / share
// links, which serve them via this proxy WITHOUT a Masar session (the owner
// session cookie is path-scoped to /owner/<token> and never reaches this route).
// Allow a proxied object only when it is a known ProjectPhoto record. Truly
// sensitive attachments (documents, expense/claim receipts, …) are NOT in this
// table and therefore stay gated.
async function isSharableProjectPhoto(
	bucket: string,
	filePath: string,
): Promise<boolean> {
	const photo = await db.projectPhoto.findFirst({
		where: { url: { contains: `/image-proxy/${bucket}/${filePath}` } },
		select: { id: true },
	});
	return !!photo;
}

export const GET = async (
	req: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) => {
	const { path } = await params;

	const [bucket, ...rest] = path;
	const filePath = rest.join("/");

	if (!(bucket && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	const ATTACHMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";
	const AVATARS_BUCKET = config.storage.bucketNames.avatars;
	const allowedBuckets = [AVATARS_BUCKET, ATTACHMENTS_BUCKET];

	if (!allowedBuckets.includes(bucket)) {
		return new Response("Not found", { status: 404 });
	}

	// ─── Authorization ───────────────────────────────────────────────────────
	// The avatars bucket holds user avatars + org logos, which are treated as
	// public-ish (referenced in PDFs, owner portal header, etc.) — allow through.
	// The attachments bucket holds tenant data and MUST be gated: require a
	// session whose user is a member of the object's organization, with a narrow
	// exception for shareable project photos (owner portal / share links).
	if (bucket !== AVATARS_BUCKET) {
		let authorized = false;

		const orgId = extractOrgId(filePath);
		if (orgId) {
			const session = await getSession();
			if (session?.user?.id && (await isOrgMember(session.user.id, orgId))) {
				authorized = true;
			}
		}

		if (!authorized && (await isSharableProjectPhoto(bucket, filePath))) {
			authorized = true;
		}

		if (!authorized) {
			return new Response("Forbidden", { status: 403 });
		}
	}

	const signedUrl = await getSignedUrl(filePath, {
		bucket,
		expiresIn: 60 * 60,
	});

	const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
	const videoContentType = VIDEO_CONTENT_TYPE_BY_EXT[ext];

	// Videos: stream through this route so the browser gets the correct
	// Content-Type, inline disposition, and HTTP Range support (seek/playback).
	// A bare redirect to the Supabase S3 signed URL fails to play in-browser.
	if (videoContentType) {
		const range = req.headers.get("range");
		const upstream = await fetch(signedUrl, {
			headers: range ? { Range: range } : {},
			// Don't cache large media on the function side.
			cache: "no-store",
		});

		if (!upstream.ok && upstream.status !== 206) {
			return new Response("Upstream error", { status: upstream.status });
		}

		const headers = new Headers();
		for (const h of PASSTHROUGH_HEADERS) {
			const v = upstream.headers.get(h);
			if (v) headers.set(h, v);
		}
		if (!headers.has("accept-ranges")) {
			headers.set("Accept-Ranges", "bytes");
		}
		headers.set("Content-Type", videoContentType);
		headers.set("Content-Disposition", "inline");
		headers.set("Cache-Control", "private, max-age=3600");

		return new Response(upstream.body, {
			status: upstream.status,
			headers,
		});
	}

	// Images / other media: cheap redirect to the signed URL (unchanged behavior).
	return NextResponse.redirect(signedUrl, {
		headers: { "Cache-Control": "max-age=3600" },
	});
};
