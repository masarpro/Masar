import { createIssue, getProjectById } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	getOrganizationAdmins,
	getProjectManagers,
	notifyIssueCreated,
} from "../../notifications/lib/notification-service";

export const createIssueProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/issues",
		tags: ["Project Field"],
		summary: "Create a new issue",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			title: z.string().trim().min(1, "عنوان المشكلة مطلوب").max(200),
			description: z.string().trim().min(1, "وصف المشكلة مطلوب").max(2000),
			severity: z
				.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
				.optional()
				.default("MEDIUM"),
			dueDate: z.coerce.date().optional(),
			assigneeId: z.string().trim().max(100).optional(),
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
				.then(async (project) => {
					if (project) {
						const [managers, admins] = await Promise.all([
							getProjectManagers(input.projectId),
							getOrganizationAdmins(input.organizationId),
						]);
						await notifyIssueCreated({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							issueId: issue.id,
							issueTitle: input.title,
							severity: input.severity,
							creatorId: context.user.id,
							managerIds: [...new Set([...managers, ...admins])],
						});
					}
				})
				.catch(() => {
					// Silently ignore notification errors
				});
		}

		return issue;
	});
