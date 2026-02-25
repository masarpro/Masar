/**
 * Delete Attachment Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { ORPCError } from "@orpc/server";
import { getAttachment, deleteAttachment } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { rateLimitChecker, RATE_LIMITS } from "../../../lib/rate-limit";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const deleteAttachmentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/attachments/delete",
		tags: ["Attachments"],
		summary: "Delete an attachment",
	})
	.input(
		z.object({
			organizationId: z.string().min(1),
			attachmentId: z.string().min(1),
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
		// Note: Storage cleanup should be handled by a separate job/cron
		await deleteAttachment(input.organizationId, input.attachmentId);

		return { success: true };
	});
