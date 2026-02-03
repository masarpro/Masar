import { ORPCError } from "@orpc/server";
import { updateProject } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteProjectProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Delete (archive) a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to delete (OWNER only per permission matrix)
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "delete" },
		);

		try {
			// Soft delete: set status to ARCHIVED instead of hard delete
			const project = await updateProject(input.id, input.organizationId, {
				status: "ARCHIVED",
			});

			return {
				success: true,
				message: "تم أرشفة المشروع بنجاح",
				project: {
					id: project.id,
					name: project.name,
					status: project.status,
				},
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: "فشل في حذف المشروع",
			});
		}
	});
