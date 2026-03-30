import { ORPCError } from "@orpc/server";
import { removeProjectMember } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const removeMember = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/team/{userId}",
		tags: ["Project Team"],
		summary: "Remove a member from the project team",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			userId: z.string().trim().max(100),
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
			await removeProjectMember(input.projectId, input.userId);

			return {
				success: true,
				message: "تم إزالة العضو من المشروع بنجاح",
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("NOT_FOUND", {
					message: error.message,
				});
			}
			throw error;
		}
	});
