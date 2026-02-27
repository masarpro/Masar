import { ORPCError } from "@orpc/server";
import { deleteActivity } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteActivityProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/activities/{activityId}",
		tags: ["Project Execution"],
		summary: "Delete an activity",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			activityId: z.string(),
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

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}
	});
