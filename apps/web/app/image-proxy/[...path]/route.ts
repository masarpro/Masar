import { config } from "@repo/config";
import { getSignedUrl } from "@repo/storage";
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
	const allowedBuckets = [config.storage.bucketNames.avatars, ATTACHMENTS_BUCKET];

	if (!allowedBuckets.includes(bucket)) {
		return new Response("Not found", { status: 404 });
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
