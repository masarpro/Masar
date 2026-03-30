import { createActivity } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { invalidateCPMCache } from "../lib/cpm-cache";

export const createActivityProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-execution/activities",
		tags: ["Project Execution"],
		summary: "Create an activity",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			milestoneId: z.string().trim().max(100),
			title: z.string().trim().min(1).max(200),
			description: z.string().trim().max(2000).optional(),
			plannedStart: z.string().datetime().optional(),
			plannedEnd: z.string().datetime().optional(),
			duration: z.number().int().min(0).optional(),
			weight: z.number().min(0).optional(),
			assigneeId: z.string().trim().max(100).optional(),
			calendarId: z.string().trim().max(100).optional(),
			notes: z.string().trim().max(5000).optional(),
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

		invalidateCPMCache(input.projectId);

		return { activity };
	});
