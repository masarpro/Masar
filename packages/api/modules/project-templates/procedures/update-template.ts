import { ORPCError } from "@orpc/server";
import { updateTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateTemplateProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/project-templates/{id}",
		tags: ["Project Templates"],
		summary: "Update a project template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1, "اسم القالب مطلوب").optional(),
			description: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to edit templates
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const template = await updateTemplate(input.id, input.organizationId, {
				name: input.name,
				description: input.description,
			});

			return template;
		} catch (error) {
			if (error instanceof Error && error.message === "Template not found") {
				throw new ORPCError("NOT_FOUND", {
					message: "القالب غير موجود",
				});
			}
			throw error;
		}
	});
