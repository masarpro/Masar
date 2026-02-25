/**
 * Create Upload URL Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { ORPCError } from "@orpc/server";
import { validateAttachment, validateFileName } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
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

// Get bucket name from config or default
const ATTACHMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const createUploadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/attachments/upload-url",
		tags: ["Attachments"],
		summary: "Generate a signed upload URL",
	})
	.input(
		z.object({
			organizationId: z.string().min(1),
			projectId: z.string().optional(),
			ownerType: AttachmentOwnerTypeEnum,
			fileName: z.string().min(1).max(255),
			fileSize: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
			mimeType: z.string().min(1),
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

		// Rate limit check
		await rateLimitChecker(user.id, "createUploadUrl", RATE_LIMITS.UPLOAD);

		// Validate file name (double extensions, dangerous types)
		const nameCheck = validateFileName(input.fileName);
		if (!nameCheck.valid) {
			throw new ORPCError("BAD_REQUEST", { message: nameCheck.error });
		}

		// Validate file type, size, and extension-MIME consistency
		const validation = validateAttachment(
			input.ownerType,
			input.mimeType,
			input.fileSize,
			input.fileName,
		);

		if (!validation.valid) {
			throw new ORPCError("BAD_REQUEST", { message: validation.error });
		}

		// Generate unique upload ID for idempotency
		const uploadId = `${input.organizationId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

		// Generate storage path
		const extension = input.fileName.split(".").pop() || "";
		const storagePath = `attachments/${input.organizationId}/${input.projectId || "general"}/${uploadId}.${extension}`;

		// Get signed upload URL using storage provider
		const signedUrl = await getSignedUploadUrl(storagePath, {
			bucket: ATTACHMENTS_BUCKET,
		});

		return {
			uploadUrl: signedUrl,
			uploadId,
			storagePath,
			expiresIn: 60, // 60 seconds
		};
	});
