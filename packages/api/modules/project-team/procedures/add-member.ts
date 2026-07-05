import { ORPCError } from "@orpc/server";
import { addProjectMember, getProjectById } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

const ROLE_LABELS: Record<string, string> = {
	MANAGER: "مدير المشروع",
	ENGINEER: "مهندس",
	SUPERVISOR: "مشرف ميداني",
	ACCOUNTANT: "محاسب المشروع",
	VIEWER: "مشاهد",
};

export const addMember = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/team",
		tags: ["Project Team"],
		summary: "Add a member to the project team",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			userId: z.string().trim().max(100),
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

			// إشعار العضو المُضاف
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.teamMemberAdded",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "project", id: input.projectId },
				recipients: [input.userId],
				data: {
					projectName: project?.name,
					role: ROLE_LABELS[input.role] ?? input.role,
				},
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
