import { describe, expect, it } from "vitest";
import {
	normalizePhotoRecord,
	normalizePhotoUrl,
} from "../../lib/media/photo-url";

describe("normalizePhotoUrl", () => {
	it("returns null for empty input", () => {
		expect(normalizePhotoUrl(null)).toBeNull();
		expect(normalizePhotoUrl(undefined)).toBeNull();
		expect(normalizePhotoUrl("")).toBeNull();
	});

	it("keeps already-relative proxy paths untouched", () => {
		const url = "/image-proxy/attachments/attachments/org1/proj1/a.jpg";
		expect(normalizePhotoUrl(url)).toBe(url);
	});

	it("strips the origin from absolute proxy URLs (stale origins 404)", () => {
		expect(
			normalizePhotoUrl(
				"http://localhost:3000/image-proxy/attachments/attachments/org1/proj1/a.jpg",
			),
		).toBe("/image-proxy/attachments/attachments/org1/proj1/a.jpg");
		expect(
			normalizePhotoUrl(
				"https://app-masar.com/image-proxy/attachments/attachments/org1/general/b.png",
			),
		).toBe("/image-proxy/attachments/attachments/org1/general/b.png");
	});

	it("rewrites expired signed S3 URLs to the stable proxy path", () => {
		expect(
			normalizePhotoUrl(
				"https://xyz.storage.supabase.co/storage/v1/s3/attachments/attachments/org1/proj1/c.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&X-Amz-Signature=abc",
			),
		).toBe("/image-proxy/attachments/attachments/org1/proj1/c.jpg");
	});

	it("rewrites supabase signed object URLs", () => {
		expect(
			normalizePhotoUrl(
				"https://xyz.supabase.co/storage/v1/object/sign/attachments/attachments/org1/proj1/d.jpg?token=eyJh",
			),
		).toBe("/image-proxy/attachments/attachments/org1/proj1/d.jpg");
	});

	it("leaves unknown URLs untouched", () => {
		const external = "https://example.com/photos/e.jpg";
		expect(normalizePhotoUrl(external)).toBe(external);
	});
});

describe("normalizePhotoRecord", () => {
	it("returns null for missing records", () => {
		expect(normalizePhotoRecord(null)).toBeNull();
		expect(normalizePhotoRecord(undefined)).toBeNull();
	});

	it("normalizes the url field and preserves the rest", () => {
		const photo = {
			id: "p1",
			url: "https://app-masar.com/image-proxy/attachments/attachments/o/p/f.jpg",
			caption: "غلاف",
		};
		expect(normalizePhotoRecord(photo)).toEqual({
			id: "p1",
			url: "/image-proxy/attachments/attachments/o/p/f.jpg",
			caption: "غلاف",
		});
	});
});
