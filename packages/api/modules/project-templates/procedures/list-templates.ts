import { getOrganizationTemplates } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listTemplates = protectedProcedure
	.route({
		method: "GET",
		path: "/project-templates",
		tags: ["Project Templates"],
		summary: "List project templates for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await getOrganizationTemplates(input.organizationId, {
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});

		return {
			templates: result.templates.map((template) => ({
				...template,
				itemsCount: template._count.items,
			})),
			total: result.total,
		};
	});
