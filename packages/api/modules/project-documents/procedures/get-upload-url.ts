import { ORPCError } from "@orpc/server";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/pdf",
];

export const getUploadUrlProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/upload-url",
		tags: ["Project Documents"],
		summary: "Get a signed upload URL for a document file",
	})
	.input(
		z.object({
			organizationId: z.string().min(1),
			projectId: z.string().min(1),
			fileName: z.string().min(1).max(255),
			mimeType: z.string().min(1),
			fileSize: z.number().int().positive(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Validate file size
		if (input.fileSize > MAX_FILE_SIZE) {
			throw new ORPCError("BAD_REQUEST", {
				message: `حجم الملف يتجاوز الحد الأقصى (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
			});
		}

		// Validate mime type
		if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "نوع الملف غير مدعوم. الأنواع المسموحة: JPEG, PNG, WebP, PDF",
			});
		}

		// Generate unique ID and storage path
		const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
		const extension = input.fileName.split(".").pop() || "";
		const storagePath = `documents/${input.organizationId}/${input.projectId}/${uploadId}.${extension}`;

		// Generate thumbnail path for images
		const isImage = input.mimeType.startsWith("image/");
		const thumbnailPath = isImage
			? `documents/${input.organizationId}/${input.projectId}/thumbnails/${uploadId}_thumb.webp`
			: null;

		// Get signed upload URL
		const uploadUrl = await getSignedUploadUrl(storagePath, {
			bucket: DOCUMENTS_BUCKET,
			contentType: input.mimeType,
		});

		// Get thumbnail upload URL if image
		let thumbnailUploadUrl: string | null = null;
		if (thumbnailPath) {
			thumbnailUploadUrl = await getSignedUploadUrl(thumbnailPath, {
				bucket: DOCUMENTS_BUCKET,
				contentType: "image/webp",
			});
		}

		return {
			uploadUrl,
			storagePath,
			thumbnailUploadUrl,
			thumbnailPath,
			uploadId,
			expiresIn: 60,
		};
	});
