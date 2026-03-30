/**
 * Finalize Upload Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { createAttachment, auditLog, validateAttachment, validateFileName, validateFileHeader } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { rateLimitChecker, RATE_LIMITS } from "../../../lib/rate-limit";
import { verifyOrganizationAccess } from "../../../lib/permissions";

const AttachmentOwnerTypeEnum = z.enum([
	"DOCUMENT",
	"PHOTO",
	"EXPENSE",
	"ISSUE",
	"MESSAGE",
	"CLAIM",
]);

export const finalizeUploadProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/attachments/finalize",
		tags: ["Attachments"],
		summary: "Finalize an upload and create attachment record",
	})
	.input(
		z.object({
			organizationId: z.string().trim().min(1).max(100),
			projectId: z.string().trim().max(100).optional(),
			uploadId: z.string().trim().min(1).max(200),
			ownerType: AttachmentOwnerTypeEnum,
			ownerId: z.string().trim().min(1).max(100),
			fileName: z.string().trim().min(1).max(255),
			fileSize: z.number().int().positive().max(100 * 1024 * 1024),
			mimeType: z.string().trim().min(1).max(200),
			storagePath: z.string().trim().min(1).max(500),
			// Optional: base64-encoded first 16 bytes for magic-byte validation
			fileHeaderBase64: z.string().max(64).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { user } = context;

		// Verify organization access with edit permission
		await verifyOrganizationAccess(
			input.organizationId,
			user.id,
			{ section: "projects", action: "edit" },
		);

		// Rate limit check (stricter for finalize)
		await rateLimitChecker(user.id, "finalizeUpload", RATE_LIMITS.UPLOAD);

		// Validate file name (double extensions, dangerous types)
		const nameCheck = validateFileName(input.fileName);
		if (!nameCheck.valid) {
			throw new ORPCError("BAD_REQUEST", { message: nameCheck.error });
		}

		// Validate file type, size, and extension-MIME consistency
		const typeCheck = validateAttachment(input.ownerType, input.mimeType, input.fileSize, input.fileName);
		if (!typeCheck.valid) {
			throw new ORPCError("BAD_REQUEST", { message: typeCheck.error });
		}

		// Validate magic bytes if client provided file header
		if (input.fileHeaderBase64) {
			const headerBytes = new Uint8Array(Buffer.from(input.fileHeaderBase64, "base64"));
			const headerCheck = validateFileHeader(headerBytes, input.mimeType);
			if (!headerCheck.valid) {
				throw new ORPCError("BAD_REQUEST", { message: headerCheck.error });
			}
		}

		// Create attachment (idempotent via uploadId)
		const attachment = await createAttachment({
			organizationId: input.organizationId,
			projectId: input.projectId,
			ownerType: input.ownerType,
			ownerId: input.ownerId,
			fileName: input.fileName,
			fileSize: input.fileSize,
			mimeType: input.mimeType,
			storagePath: input.storagePath,
			uploadId: input.uploadId,
			uploadedById: user.id,
		});

		// Audit log (fire-and-forget)
		if (input.projectId) {
			auditLog({
				organizationId: input.organizationId,
				projectId: input.projectId,
				actorId: user.id,
				action: "ATTACHMENT_CREATED",
				entityType: "attachment",
				entityId: attachment.id,
				metadata: {
					ownerType: input.ownerType,
					ownerId: input.ownerId,
					fileName: input.fileName,
					fileSize: input.fileSize,
				},
			});
		}

		return attachment;
	});
