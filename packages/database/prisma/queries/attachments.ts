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
};

/**
 * Validate file type and size
 */
export function validateAttachment(
	ownerType: AttachmentOwnerType,
	mimeType: string,
	fileSize: number,
): { valid: boolean; error?: string } {
	const allowedTypes = ALLOWED_MIME_TYPES[ownerType];
	if (!allowedTypes.includes(mimeType)) {
		return {
			valid: false,
			error: `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedTypes.join(", ")}`,
		};
	}

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
