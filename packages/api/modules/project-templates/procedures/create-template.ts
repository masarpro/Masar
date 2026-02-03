import { createTemplate, createTemplateFromProject } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const createTemplateProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-templates",
		tags: ["Project Templates"],
		summary: "Create a new project template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم القالب مطلوب"),
			description: z.string().optional(),
			sourceProjectId: z.string().optional(),
			items: z
				.array(
					z.object({
						type: z.enum(["MILESTONE", "CHECKLIST"]),
						title: z.string(),
						description: z.string().optional(),
						sortOrder: z.number().optional(),
						metadata: z.record(z.string(), z.any()).optional(),
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
