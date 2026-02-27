import { bulkUpdateProgress } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const bulkUpdateProgressProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/activities/bulk-progress",
		tags: ["Project Execution"],
		summary: "Bulk update activity progress",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			updates: z.array(
				z.object({
					activityId: z.string(),
					progress: z.number().min(0).max(100),
					status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "ON_HOLD", "CANCELLED"]).optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		await bulkUpdateProgress(
			input.organizationId,
			input.projectId,
			input.updates,
		);

		return { success: true };
	});
