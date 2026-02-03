import { createIssue, getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyIssueCreated } from "../../notifications/lib/notification-service";

export const createIssueProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-field/issues",
		tags: ["Project Field"],
		summary: "Create a new issue",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			title: z.string().min(1, "عنوان المشكلة مطلوب"),
			description: z.string().min(1, "وصف المشكلة مطلوب"),
			severity: z
				.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
				.optional()
				.default("MEDIUM"),
			dueDate: z.coerce.date().optional(),
			assigneeId: z.string().optional(),
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

		// Create the issue
		const issue = await createIssue({
			projectId: input.projectId,
			createdById: context.user.id,
			title: input.title,
			description: input.description,
			severity: input.severity,
			dueDate: input.dueDate,
			assigneeId: input.assigneeId,
		});

		// Send notification for HIGH/CRITICAL issues (fire and forget)
		if (input.severity === "HIGH" || input.severity === "CRITICAL") {
			getProjectById(input.projectId, input.organizationId)
				.then((project) => {
					if (project) {
						notifyIssueCreated({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							issueId: issue.id,
							issueTitle: input.title,
							severity: input.severity,
							creatorId: context.user.id,
							managerIds: [], // Will be populated by notifyProjectManagers internally
						}).catch(() => {
							// Silently ignore notification errors
						});
					}
				})
				.catch(() => {
					// Silently ignore errors
				});
		}

		return issue;
	});
