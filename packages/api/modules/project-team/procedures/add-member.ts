import { ORPCError } from "@orpc/server";
import { addProjectMember, getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyTeamMemberAdded } from "../../notifications/lib/notification-service";

export const addMember = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/team",
		tags: ["Project Team"],
		summary: "Add a member to the project team",
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
			const member = await addProjectMember({
				projectId: input.projectId,
				organizationId: input.organizationId,
				userId: input.userId,
				role: input.role,
				assignedById: context.user.id,
			});

			// Notify the added user (fire and forget)
			getProjectById(input.projectId, input.organizationId)
				.then((project) => {
					if (project) {
						notifyTeamMemberAdded({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							addedUserId: input.userId,
							role: input.role,
							addedById: context.user.id,
						}).catch(() => {
							// Silently ignore notification errors
						});
					}
				})
				.catch(() => {
					// Silently ignore errors
				});

			return { member };
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("عضو بالفعل")) {
					throw new ORPCError("CONFLICT", {
						message: error.message,
					});
				}
				throw new ORPCError("BAD_REQUEST", {
					message: error.message,
				});
			}
			throw error;
		}
	});
