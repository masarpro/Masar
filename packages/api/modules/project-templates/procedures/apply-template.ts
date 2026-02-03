import { ORPCError } from "@orpc/server";
import { applyTemplateToProject } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const applyTemplateProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-templates/apply",
		tags: ["Project Templates"],
		summary: "Apply a template to a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			templateId: z.string(),
			projectId: z.string(),
			options: z
				.object({
					/**
					 * If true, delete existing milestones before applying template
					 */
					replaceExisting: z.boolean().optional(),
					/**
					 * Start date for the first milestone
					 */
					startDate: z.string().datetime().optional(),
					/**
					 * Duration in days between milestones (default: 7)
					 */
					durationBetweenMilestones: z.number().min(1).max(365).optional(),
					/**
					 * Specific item indices to include (0-based)
					 */
					selectedItems: z.array(z.number().min(0)).optional(),
				})
				.optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership and permission to apply template to project
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const result = await applyTemplateToProject({
				organizationId: input.organizationId,
				templateId: input.templateId,
				projectId: input.projectId,
				options: input.options
					? {
							replaceExisting: input.options.replaceExisting,
							startDate: input.options.startDate
								? new Date(input.options.startDate)
								: undefined,
							durationBetweenMilestones: input.options.durationBetweenMilestones,
							selectedItems: input.options.selectedItems,
						}
					: undefined,
			});

			return {
				success: true,
				milestonesCreated: result.milestonesCreated,
				milestonesDeleted: result.milestonesDeleted,
				projectId: result.projectId,
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Template not found") {
					throw new ORPCError("NOT_FOUND", {
						message: "القالب غير موجود",
					});
				}
				if (error.message === "Project not found") {
					throw new ORPCError("NOT_FOUND", {
						message: "المشروع غير موجود",
					});
				}
			}
			throw error;
		}
	});
