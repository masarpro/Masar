/**
 * List Attachments Procedure
 * Phase 6: Production Hardening - Attachments
 */

import { listAttachments } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

const AttachmentOwnerTypeEnum = z.enum([
	"DOCUMENT",
	"PHOTO",
	"EXPENSE",
	"ISSUE",
	"MESSAGE",
	"CLAIM",
]);

export const listAttachmentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/attachments/list",
		tags: ["Attachments"],
		summary: "List attachments for an entity",
	})
	.input(
		z.object({
			organizationId: z.string().min(1),
			ownerType: AttachmentOwnerTypeEnum,
			ownerId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify organization access with view permission
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const attachments = await listAttachments(
			input.organizationId,
			input.ownerType,
			input.ownerId,
		);

		return { attachments };
	});
