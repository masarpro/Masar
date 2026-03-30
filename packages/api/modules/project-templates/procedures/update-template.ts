import { ORPCError } from "@orpc/server";
import { updateTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const updateTemplateProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/project-templates/{id}",
		tags: ["Project Templates"],
		summary: "Update a project template",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			id: z.string().trim().max(100),
			name: z.string().trim().min(1, "اسم القالب مطلوب").max(200).optional(),
			description: z.string().trim().max(2000).optional(),
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
