/**
 * Attachments Queries - استعلامات المرفقات
 * Phase 6: Production Hardening
 */

import { db } from "../client";
import type { AttachmentOwnerType } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateAttachmentInput {
	organizationId: string;
	projectId?: string;
	ownerType: AttachmentOwnerType;
	ownerId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	storagePath: string;
	uploadId?: string;
	uploadedById: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Create Attachment
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an attachment (idempotent via uploadId)
 */
export async function createAttachment(data: CreateAttachmentInput) {
	// If uploadId provided, check for existing (idempotency)
	if (data.uploadId) {
		const existing = await db.attachment.findUnique({
			where: { uploadId: data.uploadId },
		});
		if (existing) {
			return existing;
		}
	}

	return db.attachment.create({
		data: {
			organizationId: data.organizationId,
			projectId: data.projectId,
			ownerType: data.ownerType,
			ownerId: data.ownerId,
			fileName: data.fileName,
			fileSize: data.fileSize,
			mimeType: data.mimeType,
			storagePath: data.storagePath,
			uploadId: data.uploadId,
			uploadedById: data.uploadedById,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// List Attachments
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List attachments for an entity
 */
export async function listAttachments(
	organizationId: string,
	ownerType: AttachmentOwnerType,
	ownerId: string,
) {
	return db.attachment.findMany({
		where: {
			organizationId,
			ownerType,
			ownerId,
		},
		include: {
			uploadedBy: {
				select: { id: true, name: true, image: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * List attachments for a project
 */
export async function listProjectAttachments(
	organizationId: string,
	projectId: string,
	options?: {
		ownerType?: AttachmentOwnerType;
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 50;
	const skip = (page - 1) * pageSize;

	const where = {
		organizationId,
		projectId,
		...(options?.ownerType && { ownerType: options.ownerType }),
	};

	const [attachments, total] = await Promise.all([
		db.attachment.findMany({
			where,
			include: {
				uploadedBy: {
					select: { id: true, name: true, image: true },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.attachment.count({ where }),
	]);

	return {
		attachments,
		pagination: {
			page,
			pageSize,
			total,
			totalPages: Math.ceil(total / pageSize),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Attachment
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a single attachment by ID
 */
export async function getAttachment(organizationId: string, attachmentId: string) {
	return db.attachment.findFirst({
		where: {
			id: attachmentId,
			organizationId,
		},
		include: {
			uploadedBy: {
				select: { id: true, name: true, image: true },
			},
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Delete Attachment
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delete an attachment
 */
export async function deleteAttachment(organizationId: string, attachmentId: string) {
	return db.attachment.delete({
		where: {
			id: attachmentId,
			organizationId,
		},
	});
}

/**
 * Delete all attachments for an entity
 */
export async function deleteAttachmentsByOwner(
	organizationId: string,
	ownerType: AttachmentOwnerType,
	ownerId: string,
) {
	return db.attachment.deleteMany({
		where: {
			organizationId,
			ownerType,
			ownerId,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Bulk Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Link multiple attachments to an entity
 * Used after bulk upload to associate temp attachments with their owner
 */
export async function linkAttachmentsToOwner(
	organizationId: string,
	attachmentIds: string[],
	ownerType: AttachmentOwnerType,
	ownerId: string,
) {
	return db.attachment.updateMany({
		where: {
			id: { in: attachmentIds },
			organizationId,
		},
		data: {
			ownerType,
			ownerId,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Blocked MIME types (security risk)
const BLOCKED_MIME_TYPES = new Set([
	"image/svg+xml",
	"text/html",
	"application/xhtml+xml",
	"application/javascript",
	"text/javascript",
]);

// Dangerous file extensions (executable or script)
const DANGEROUS_EXTENSIONS = new Set([
	"exe", "bat", "cmd", "com", "msi", "scr", "pif",
	"js", "vbs", "wsf", "wsh", "ps1", "sh", "bash",
	"svg", "html", "htm", "xhtml", "hta",
]);

// Extension → allowed MIME types mapping for consistency checks
const EXTENSION_MIME_MAP: Record<string, string[]> = {
	pdf: ["application/pdf"],
	doc: ["application/msword"],
	docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
	xls: ["application/vnd.ms-excel"],
	xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
	jpg: ["image/jpeg"],
	jpeg: ["image/jpeg"],
	png: ["image/png"],
	webp: ["image/webp"],
	heic: ["image/heic"],
};

// Magic byte signatures for file type verification
const MAGIC_SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
	{ mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] }, // \x89PNG
	{ mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] }, // \xFF\xD8\xFF
	{ mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
	{ mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (WebP)
];

// Allowed MIME types per owner type
const ALLOWED_MIME_TYPES: Record<AttachmentOwnerType, string[]> = {
	DOCUMENT: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"image/jpeg",
		"image/png",
		"image/webp",
	],
	PHOTO: ["image/jpeg", "image/png", "image/webp", "image/heic"],
	EXPENSE: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
	ISSUE: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
	MESSAGE: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
	CLAIM: ["application/pdf", "image/jpeg", "image/png"],
	CHANGE_ORDER: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
	CLIENT: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
};

// Max file sizes (in bytes)
const MAX_FILE_SIZES: Record<AttachmentOwnerType, number> = {
	DOCUMENT: 50 * 1024 * 1024, // 50MB
	PHOTO: 20 * 1024 * 1024, // 20MB
	EXPENSE: 10 * 1024 * 1024, // 10MB
	ISSUE: 20 * 1024 * 1024, // 20MB
	MESSAGE: 10 * 1024 * 1024, // 10MB
	CLAIM: 20 * 1024 * 1024, // 20MB
	CHANGE_ORDER: 20 * 1024 * 1024, // 20MB
	CLIENT: 10 * 1024 * 1024, // 10MB
};

/**
 * Validate file name for security issues:
 * - Double extensions (invoice.pdf.exe)
 * - Dangerous extensions (svg, exe, bat, etc.)
 */
export function validateFileName(fileName: string): { valid: boolean; error?: string } {
	const normalized = fileName.trim().toLowerCase();

	// Split on dots — more than 2 parts means double extension (e.g. "file.pdf.exe")
	const parts = normalized.split(".");
	if (parts.length > 2) {
		// Check if any non-final part is a dangerous extension
		for (let i = 1; i < parts.length - 1; i++) {
			if (DANGEROUS_EXTENSIONS.has(parts[i])) {
				return { valid: false, error: "اسم الملف يحتوي على امتداد مزدوج مشبوه" };
			}
		}
	}

	// Check final extension against dangerous list
	const ext = parts[parts.length - 1];
	if (DANGEROUS_EXTENSIONS.has(ext)) {
		return { valid: false, error: `امتداد الملف غير مسموح: .${ext}` };
	}

	return { valid: true };
}

/**
 * Validate file type, size, extension-MIME consistency, and blocked types
 */
export function validateAttachment(
	ownerType: AttachmentOwnerType,
	mimeType: string,
	fileSize: number,
	fileName?: string,
): { valid: boolean; error?: string } {
	// 1. Block dangerous MIME types (SVG, HTML, JS)
	if (BLOCKED_MIME_TYPES.has(mimeType)) {
		return { valid: false, error: "نوع الملف محظور لأسباب أمنية" };
	}

	// 2. Check allowed MIME types per owner type
	const allowedTypes = ALLOWED_MIME_TYPES[ownerType];
	if (!allowedTypes.includes(mimeType)) {
		return {
			valid: false,
			error: `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(", ")}`,
		};
	}

	// 3. Extension-MIME consistency check
	if (fileName) {
		const ext = fileName.split(".").pop()?.toLowerCase();
		if (ext && EXTENSION_MIME_MAP[ext]) {
			if (!EXTENSION_MIME_MAP[ext].includes(mimeType)) {
				return {
					valid: false,
					error: `امتداد الملف (.${ext}) لا يتطابق مع نوع المحتوى (${mimeType})`,
				};
			}
		}
	}

	// 4. File size check
	const maxSize = MAX_FILE_SIZES[ownerType];
	if (fileSize > maxSize) {
		const maxSizeMB = Math.round(maxSize / (1024 * 1024));
		return {
			valid: false,
			error: `حجم الملف يتجاوز الحد المسموح (${maxSizeMB} ميجابايت)`,
		};
	}

	return { valid: true };
}

/**
 * Validate file header (magic bytes) against claimed MIME type.
 * Pass the first 8+ bytes of the file content.
 * Returns valid=true if no signature match is expected (e.g. .docx, .xlsx)
 * or if the signature matches the claimed type.
 */
export function validateFileHeader(
	headerBytes: Uint8Array,
	claimedMimeType: string,
): { valid: boolean; error?: string; detectedType?: string } {
	if (headerBytes.length < 4) {
		return { valid: false, error: "بيانات ترويسة الملف غير كافية للتحقق" };
	}

	// Find a matching signature in the header
	for (const sig of MAGIC_SIGNATURES) {
		const matches = sig.bytes.every((b, i) => headerBytes[i] === b);
		if (matches) {
			// WebP special case: RIFF header shared with other formats,
			// check for WEBP at offset 8
			if (sig.mime === "image/webp") {
				if (
					headerBytes.length >= 12 &&
					headerBytes[8] === 0x57 && // W
					headerBytes[9] === 0x45 && // E
					headerBytes[10] === 0x42 && // B
					headerBytes[11] === 0x50 // P
				) {
					if (claimedMimeType !== "image/webp") {
						return {
							valid: false,
							detectedType: "image/webp",
							error: `محتوى الملف (image/webp) لا يتطابق مع النوع المُعلن (${claimedMimeType})`,
						};
					}
					return { valid: true, detectedType: "image/webp" };
				}
				// RIFF but not WebP — skip this signature
				continue;
			}

			if (claimedMimeType !== sig.mime) {
				return {
					valid: false,
					detectedType: sig.mime,
					error: `محتوى الملف (${sig.mime}) لا يتطابق مع النوع المُعلن (${claimedMimeType})`,
				};
			}
			return { valid: true, detectedType: sig.mime };
		}
	}

	// No known signature matched — allow (covers .docx, .xlsx, .heic, etc.)
	return { valid: true };
}
