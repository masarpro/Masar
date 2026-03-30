import { getProjectIssues } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listIssuesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-field/issues",
		tags: ["Project Field"],
		summary: "List issues for a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			status: z
				.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
				.optional(),
			severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
			limit: z.number().int().min(1).max(500).optional().default(50),
			offset: z.number().int().nonnegative().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await getProjectIssues(input.projectId, {
			status: input.status,
			severity: input.severity,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});
