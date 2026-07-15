import { ORPCError } from "@orpc/server";
import { getSignedUploadUrl, UPLOAD_URL_EXPIRES_IN } from "@repo/storage";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const DOCUMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB — يدعم ملفات Revit/Max/CAD الكبيرة

// allowlist بالامتداد: ملفات CAD/3D ترسل MIME فارغ أو octet-stream،
// فالاعتماد على الامتداد أوثق من الاعتماد على MIME.
const ALLOWED_EXTENSIONS = new Set([
	// صور
	"jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "svg", "heic",
	// مستندات
	"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf",
	// مضغوطة
	"zip", "rar", "7z",
	// فيديو
	"mp4", "mov", "avi", "mkv", "webm",
	// تصميم هندسي/معماري
	"dwg", "dxf", "dwf", // AutoCAD
	"rvt", "rfa", "rte", // Revit
	"skp", // SketchUp
	"max", "3ds", // 3ds Max
	"obj", "fbx", "stl", "dae", "blend", // 3D عام
	"ls", "lsproj", // Lumion
	"ifc", "nwd", "nwc", // BIM / Navisworks
	"pln", "pla", // ArchiCAD
	"ai", "psd", "indd", "eps", // Adobe
]);

export const getUploadUrlProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/documents/upload-url",
		tags: ["Project Documents"],
		summary: "Get a signed upload URL for a document file",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100).min(1),
			projectId: z.string().trim().max(100).min(1),
			fileName: z.string().trim().min(1).max(255),
			mimeType: z.string().trim().min(1).max(2000),
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

		// Validate by extension (أوثق من MIME لملفات CAD/3D)
		const extension = (input.fileName.split(".").pop() || "").toLowerCase();
		if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "نوع الملف غير مدعوم",
			});
		}

		// Generate unique ID and storage path
		const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
		const storagePath = `documents/${input.organizationId}/${input.projectId}/${uploadId}.${extension}`;

		// Generate thumbnail path for images
		const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];
		const isImage =
			input.mimeType.startsWith("image/") ||
			IMAGE_EXTENSIONS.includes(extension);
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
			expiresIn: UPLOAD_URL_EXPIRES_IN,
		};
	});
