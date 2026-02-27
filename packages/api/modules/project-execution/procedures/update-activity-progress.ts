import { ORPCError } from "@orpc/server";
import { updateActivityProgress } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateActivityProgressProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/project-execution/activities/{activityId}/progress",
		tags: ["Project Execution"],
		summary: "Update activity progress",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			activityId: z.string(),
			progress: z.number().min(0).max(100),
			status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "ON_HOLD", "CANCELLED"]).optional(),
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
			const activity = await updateActivityProgress(
				input.organizationId,
				input.projectId,
				input.activityId,
				input.progress,
				input.status,
			);

			return { activity };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}
	});
