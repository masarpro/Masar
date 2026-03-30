import { ORPCError } from "@orpc/server";
import { deleteActivity } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { invalidateCPMCache } from "../lib/cpm-cache";

export const deleteActivityProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/activities/{activityId}",
		tags: ["Project Execution"],
		summary: "Delete an activity",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			activityId: z.string().trim().max(100),
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
			await deleteActivity(
				input.organizationId,
				input.projectId,
				input.activityId,
			);

			invalidateCPMCache(input.projectId);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}
	});
