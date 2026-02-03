import { listProjectShareLinks } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listShareLinksProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/shares/list",
		tags: ["Shares"],
		summary: "List share links for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			resourceType: z
				.enum([
					"UPDATE_PDF",
					"CLAIM_PDF",
					"DOCUMENT",
					"PHOTO_ALBUM",
					"ICS",
					"WEEKLY_REPORT",
				])
				.optional(),
			includeRevoked: z.boolean().optional().default(false),
			limit: z.number().min(1).max(100).optional().default(50),
			offset: z.number().min(0).optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		const result = await listProjectShareLinks(
			input.organizationId,
			input.projectId,
			{
				resourceType: input.resourceType,
				includeRevoked: input.includeRevoked,
				limit: input.limit,
				offset: input.offset,
			},
		);

		// Generate share URLs
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const linksWithUrls = result.links.map((link) => ({
			...link,
			shareUrl: `${baseUrl}/share/${link.token}`,
		}));

		return {
			links: linksWithUrls,
			total: result.total,
		};
	});
