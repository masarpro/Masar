/**
 * Delete Attachment Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { ORPCError } from "@orpc/server";
import { getAttachment, deleteAttachment } from "@repo/database";
import { deleteFile } from "@repo/storage";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { rateLimitChecker, RATE_LIMITS } from "../../../lib/rate-limit";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const deleteAttachmentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/attachments/delete",
		tags: ["Attachments"],
		summary: "Delete an attachment",
	})
	.input(
		z.object({
			organizationId: z.string().trim().min(1).max(100),
			attachmentId: z.string().trim().min(1).max(100),
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
		await rateLimitChecker(user.id, "deleteAttachment", RATE_LIMITS.WRITE);

		// Verify attachment exists and belongs to organization
		const attachment = await getAttachment(
			input.organizationId,
			input.attachmentId,
		);

		if (!attachment) {
			throw new ORPCError("NOT_FOUND", { message: "المرفق غير موجود" });
		}

		// Delete from database
		await deleteAttachment(input.organizationId, input.attachmentId);

		// Clean up S3 file (fire-and-forget)
		if (attachment.storagePath) {
			deleteFile(attachment.storagePath, {
				bucket: process.env.S3_ATTACHMENTS_BUCKET ?? "attachments",
			}).catch((err) => {
				console.error("[Storage] Failed to delete file:", attachment.storagePath, err);
			});
		}

		return { success: true };
	});
