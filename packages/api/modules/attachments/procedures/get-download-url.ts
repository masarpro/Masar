/**
 * Get Download URL Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { ORPCError } from "@orpc/server";
import { getAttachment } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// Get bucket name from config or default
const ATTACHMENTS_BUCKET = process.env.S3_ATTACHMENTS_BUCKET || "attachments";

export const getDownloadUrlProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/attachments/download-url",
		tags: ["Attachments"],
		summary: "Get a signed download URL for an attachment",
	})
	.input(
		z.object({
			organizationId: z.string().min(1),
			attachmentId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify organization access with view permission
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const attachment = await getAttachment(
			input.organizationId,
			input.attachmentId,
		);

		if (!attachment) {
			throw new ORPCError("NOT_FOUND", { message: "المرفق غير موجود" });
		}

		// Generate signed download URL (valid for 1 hour)
		const signedUrl = await getSignedUrl(attachment.storagePath, {
			bucket: ATTACHMENTS_BUCKET,
			expiresIn: 3600, // 1 hour
		});

		return {
			downloadUrl: signedUrl,
			fileName: attachment.fileName,
			mimeType: attachment.mimeType,
			fileSize: attachment.fileSize,
		};
	});
