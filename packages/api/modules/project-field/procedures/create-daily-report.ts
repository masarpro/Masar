import { createDailyReport, getProjectById } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";

export const createDailyReportProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/daily-reports",
		tags: ["Project Field"],
		summary: "Create a new daily report",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			reportDate: z.coerce.date(),
			manpower: z.number().int().min(0).default(0),
			equipment: z.string().trim().max(100).optional(),
			workDone: z.string().trim().min(1, "الأعمال المنجزة مطلوبة").max(5000),
			blockers: z.string().trim().max(100).optional(),
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

		// إشعار مديري المشروع + مسؤولي المنظمة (الجمهور يُحل من السجل)
		const project = await getProjectById(input.projectId, input.organizationId);
		await notifyEvent({
			event: "projects.dailyReportCreated",
			organizationId: input.organizationId,
			actorId: context.user.id,
			projectId: input.projectId,
			entity: { type: "dailyReport", id: report.id },
			data: {
				projectName: project?.name,
				reportDate: input.reportDate.toLocaleDateString("ar-SA"),
			},
		});

		return report;
	});
