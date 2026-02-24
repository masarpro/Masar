import { ORPCError } from "@orpc/server";
import { deletePhoto, getProjectMemberRole } from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { getUserPermissions } from "../../../lib/permissions/get-user-permissions";

export const deletePhotoProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-field/photos/{photoId}",
		tags: ["Project Field"],
		summary: "Delete a project photo (project manager only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			photoId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify basic project access
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
		);

		// Restrict to project manager: either project role MANAGER or org permission manageTeam
		const [projectRole, permissions] = await Promise.all([
			getProjectMemberRole(input.projectId, context.user.id),
			getUserPermissions(context.user.id, input.organizationId),
		]);

		const isManager =
			projectRole === "MANAGER" ||
			hasPermission(permissions, "projects", "manageTeam");

		if (!isManager) {
			throw new ORPCError("FORBIDDEN", {
				message: "فقط مدير المشروع يمكنه حذف الصور",
			});
		}

		try {
			await deletePhoto(input.photoId, input.projectId);
			return { success: true, message: "تم حذف الصورة بنجاح" };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("NOT_FOUND", {
					message: error.message,
				});
			}
			throw error;
		}
	});
