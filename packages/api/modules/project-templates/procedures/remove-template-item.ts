import { ORPCError } from "@orpc/server";
import { removeTemplateItem } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const removeTemplateItemProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-templates/{templateId}/items/{itemId}",
		tags: ["Project Templates"],
		summary: "Remove an item from a project template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			templateId: z.string(),
			itemId: z.string(),
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
			await removeTemplateItem(
				input.itemId,
				input.templateId,
				input.organizationId,
			);

			return {
				success: true,
				message: "تم حذف العنصر بنجاح",
			};
		} catch (error) {
			if (error instanceof Error && error.message === "Template not found") {
				throw new ORPCError("NOT_FOUND", {
					message: "القالب غير موجود",
				});
			}
			throw error;
		}
	});
