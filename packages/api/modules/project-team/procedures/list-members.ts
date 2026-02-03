import { getProjectMembers } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listMembers = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/team",
		tags: ["Project Team"],
		summary: "List project team members",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to view projects
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const members = await getProjectMembers(
			input.projectId,
			input.organizationId,
		);

		return { members };
	});
