import { createShareLink } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const createShareLinkProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/shares/create",
		tags: ["Shares"],
		summary: "Create a share link for a resource",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			resourceType: z.enum([
				"UPDATE_PDF",
				"CLAIM_PDF",
				"DOCUMENT",
				"PHOTO_ALBUM",
				"ICS",
				"WEEKLY_REPORT",
			]),
			resourceId: z.string().optional(),
			expiresInDays: z.number().min(1).max(365).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		// Create the share link
		const shareLink = await createShareLink({
			organizationId: input.organizationId,
			projectId: input.projectId,
			resourceType: input.resourceType,
			resourceId: input.resourceId,
			createdById: context.user.id,
			expiresInDays: input.expiresInDays,
		});

		// Generate the full share URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const shareUrl = `${baseUrl}/share/${shareLink.token}`;

		return {
			shareLink,
			shareUrl,
		};
	});
