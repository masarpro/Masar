import { createActivity } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const createActivityProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/activities",
		tags: ["Project Execution"],
		summary: "Create an activity",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			milestoneId: z.string(),
			title: z.string().min(1).max(200),
			description: z.string().max(2000).optional(),
			plannedStart: z.string().datetime().optional(),
			plannedEnd: z.string().datetime().optional(),
			duration: z.number().int().min(0).optional(),
			weight: z.number().min(0).optional(),
			assigneeId: z.string().optional(),
			calendarId: z.string().optional(),
			notes: z.string().max(5000).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const activity = await createActivity(
			input.organizationId,
			input.projectId,
			input.milestoneId,
			{
				title: input.title,
				description: input.description,
				plannedStart: input.plannedStart ? new Date(input.plannedStart) : undefined,
				plannedEnd: input.plannedEnd ? new Date(input.plannedEnd) : undefined,
				duration: input.duration,
				weight: input.weight,
				assigneeId: input.assigneeId,
				calendarId: input.calendarId,
				notes: input.notes,
			},
		);

		return { activity };
	});
