import { ORPCError } from "@orpc/server";
import { deleteTemplate } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteTemplateProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-templates/{id}",
		tags: ["Project Templates"],
		summary: "Delete a project template",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to delete templates (same as create permission)
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "delete" },
		);

		try {
			await deleteTemplate(input.id, input.organizationId);

			return {
				success: true,
				message: "تم حذف القالب بنجاح",
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
