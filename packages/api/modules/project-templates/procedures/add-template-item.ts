import { ORPCError } from "@orpc/server";
import { addTemplateItem } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const addTemplateItemProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-templates/{templateId}/items",
		tags: ["Project Templates"],
		summary: "Add an item to a project template",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			templateId: z.string().trim().max(100),
			type: z.enum(["MILESTONE", "CHECKLIST"]),
			title: z.string().trim().min(1, "عنوان العنصر مطلوب").max(200),
			description: z.string().trim().max(2000).optional(),
			sortOrder: z.number().int().min(0).max(999999).optional(),
			metadata: z.record(z.string().max(100), z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])).optional(),
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
