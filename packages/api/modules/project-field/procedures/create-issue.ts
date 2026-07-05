import { createIssue, getProjectById } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

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

		// إشعار — الحرجة/العالية لها حدث مستقل بقنوات أقوى
		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event:
				input.severity === "HIGH" || input.severity === "CRITICAL"
					? "projects.issueCritical"
					: "projects.issueCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "issue", id: issue.id },
			data: {
				projectName: project?.name,
				issueTitle: input.title,
			},
		});

		return issue;
	});
