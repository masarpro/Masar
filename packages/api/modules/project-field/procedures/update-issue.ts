import { updateIssue } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateIssueProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/project-field/issues/{id}",
		tags: ["Project Field"],
		summary: "Update an issue",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
			status: z
				.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
				.optional(),
			dueDate: z.coerce.date().nullable().optional(),
			assigneeId: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Update the issue
		const issue = await updateIssue(input.id, input.projectId, {
			title: input.title,
			description: input.description,
			severity: input.severity,
			status: input.status,
			dueDate: input.dueDate,
			assigneeId: input.assigneeId,
		});

		return issue;
	});
