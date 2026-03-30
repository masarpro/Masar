import { createTemplate, createTemplateFromProject } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createTemplateProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-templates",
		tags: ["Project Templates"],
		summary: "Create a new project template",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1, "اسم القالب مطلوب").max(200),
			description: z.string().trim().max(2000).optional(),
			sourceProjectId: z.string().trim().max(100).optional(),
			items: z
				.array(
					z.object({
						type: z.enum(["MILESTONE", "CHECKLIST"]),
						title: z.string().trim().max(200),
						description: z.string().trim().max(2000).optional(),
						sortOrder: z.number().int().min(0).max(999999).optional(),
						metadata: z.record(z.string().max(100), z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])).optional(),
					}),
				)
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to create templates
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "create" },
		);

		// If sourceProjectId is provided, create from project
		if (input.sourceProjectId) {
			const template = await createTemplateFromProject({
				organizationId: input.organizationId,
				createdById: context.user.id,
				sourceProjectId: input.sourceProjectId,
				name: input.name,
				description: input.description,
			});

			return template;
		}

		// Create from scratch
		const template = await createTemplate({
			organizationId: input.organizationId,
			createdById: context.user.id,
			name: input.name,
			description: input.description,
			items: input.items,
		});

		return template;
	});
