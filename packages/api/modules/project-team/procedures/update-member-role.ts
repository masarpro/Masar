import { ORPCError } from "@orpc/server";
import { updateProjectMemberRole } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateMemberRole = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/team/{userId}",
		tags: ["Project Team"],
		summary: "Update a team member's role",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			userId: z.string(),
			role: z.enum(["MANAGER", "ENGINEER", "SUPERVISOR", "ACCOUNTANT", "VIEWER"]),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to manage team
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		try {
			const member = await updateProjectMemberRole(
				input.projectId,
				input.userId,
				input.role,
			);

			return { member };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("NOT_FOUND", {
					message: error.message,
				});
			}
			throw error;
		}
	});
