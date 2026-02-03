import { createDailyReport, getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyDailyReportCreated } from "../../notifications/lib/notification-service";

export const createDailyReportProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-field/daily-reports",
		tags: ["Project Field"],
		summary: "Create a new daily report",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			reportDate: z.coerce.date(),
			manpower: z.number().int().min(0).default(0),
			equipment: z.string().optional(),
			workDone: z.string().min(1, "الأعمال المنجزة مطلوبة"),
			blockers: z.string().optional(),
			weather: z
				.enum(["SUNNY", "CLOUDY", "RAINY", "WINDY", "DUSTY", "HOT", "COLD"])
				.optional()
				.default("SUNNY"),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission (projects.edit for creating reports)
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Create the daily report
		const report = await createDailyReport({
			projectId: input.projectId,
			createdById: context.user.id,
			reportDate: input.reportDate,
			manpower: input.manpower,
			equipment: input.equipment,
			workDone: input.workDone,
			blockers: input.blockers,
			weather: input.weather,
		});

		// Send notification to project managers (fire and forget)
		getProjectById(input.projectId, input.organizationId)
			.then((project) => {
				if (project) {
					// Notify project managers - for now, we'll use org admins
					// In a full implementation, we'd get project team managers
					notifyDailyReportCreated({
						organizationId: input.organizationId,
						projectId: input.projectId,
						projectName: project.name,
						reportId: report.id,
						reportDate: input.reportDate.toLocaleDateString("ar-SA"),
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

		return report;
	});
