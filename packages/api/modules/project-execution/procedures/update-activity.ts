import { ORPCError } from "@orpc/server";
import { updateActivity } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { invalidateCPMCache } from "../lib/cpm-cache";

export const updateActivityProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/project-execution/activities/{activityId}",
		tags: ["Project Execution"],
		summary: "Update an activity",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			activityId: z.string().trim().max(100),
			title: z.string().trim().min(1).max(200).optional(),
			description: z.string().trim().max(2000).optional().nullable(),
			plannedStart: z.string().datetime().optional().nullable(),
			plannedEnd: z.string().datetime().optional().nullable(),
			duration: z.number().int().min(0).optional().nullable(),
			actualStart: z.string().datetime().optional().nullable(),
			actualEnd: z.string().datetime().optional().nullable(),
			status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "ON_HOLD", "CANCELLED"]).optional(),
			progress: z.number().min(0).max(100).optional(),
			isCritical: z.boolean().optional(),
			weight: z.number().min(0).optional().nullable(),
			assigneeId: z.string().trim().max(100).optional().nullable(),
			calendarId: z.string().trim().max(100).optional().nullable(),
			notes: z.string().trim().max(5000).optional().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const {
				organizationId,
				projectId,
				activityId,
				plannedStart,
				plannedEnd,
				actualStart,
				actualEnd,
				...rest
			} = input;
			const activity = await updateActivity(
				organizationId,
				projectId,
				activityId,
				{
					title: rest.title,
					description: rest.description,
					duration: rest.duration,
					status: rest.status as any,
					progress: rest.progress,
					isCritical: rest.isCritical,
					weight: rest.weight,
					assigneeId: rest.assigneeId,
					calendarId: rest.calendarId,
					notes: rest.notes,
					plannedStart: plannedStart ? new Date(plannedStart) : plannedStart === null ? null : undefined,
					plannedEnd: plannedEnd ? new Date(plannedEnd) : plannedEnd === null ? null : undefined,
					actualStart: actualStart ? new Date(actualStart) : actualStart === null ? null : undefined,
					actualEnd: actualEnd ? new Date(actualEnd) : actualEnd === null ? null : undefined,
				},
			);

			invalidateCPMCache(input.projectId);

			return { activity };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}
	});
