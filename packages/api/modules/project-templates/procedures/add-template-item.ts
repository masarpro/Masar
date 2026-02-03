import { ORPCError } from "@orpc/server";
import { addTemplateItem } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const addTemplateItemProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-templates/{templateId}/items",
		tags: ["Project Templates"],
		summary: "Add an item to a project template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			templateId: z.string(),
			type: z.enum(["MILESTONE", "CHECKLIST"]),
			title: z.string().min(1, "عنوان العنصر مطلوب"),
			description: z.string().optional(),
			sortOrder: z.number().optional(),
			metadata: z.record(z.string(), z.any()).optional(),
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
			const item = await addTemplateItem(
				input.templateId,
				input.organizationId,
				{
					type: input.type,
					title: input.title,
					description: input.description,
					sortOrder: input.sortOrder,
					metadata: input.metadata,
				},
			);

			return item;
		} catch (error) {
			if (error instanceof Error && error.message === "Template not found") {
				throw new ORPCError("NOT_FOUND", {
					message: "القالب غير موجود",
				});
			}
			throw error;
		}
	});
