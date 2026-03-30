import { upsertCalendar } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const upsertCalendarProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-execution/calendar",
		tags: ["Project Execution"],
		summary: "Create or update project calendar",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200).optional(),
			workDays: z.array(z.number().int().min(0).max(6)).optional(),
			holidays: z
				.array(
					z.object({
						date: z.string().trim().max(50),
						name: z.string().trim().max(200),
					}),
				)
				.optional(),
			defaultHoursPerDay: z.number().min(1).max(24).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const calendar = await upsertCalendar(
			input.organizationId,
			input.projectId,
			{
				name: input.name,
				workDays: input.workDays,
				holidays: input.holidays,
				defaultHoursPerDay: input.defaultHoursPerDay,
			},
		);

		return { calendar };
	});
