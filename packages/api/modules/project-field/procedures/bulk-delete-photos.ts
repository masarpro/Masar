import { ORPCError } from "@orpc/server";
import { bulkDeletePhotos, getProjectMemberRole } from "@repo/database";
import { hasPermission } from "@repo/database/prisma/permissions";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { getUserPermissions } from "../../../lib/permissions/get-user-permissions";

export const bulkDeletePhotosProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/photos/bulk-delete",
		tags: ["Project Field"],
		summary: "Bulk delete project photos (project manager only)",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			photoIds: z.array(z.string().trim().max(100)).min(1).max(500),
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
			const result = await bulkDeletePhotos(input.photoIds, input.projectId);
			return { success: true, count: result.count };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", { message: error.message });
			}
			throw error;
		}
	});
