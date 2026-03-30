import { addProgressUpdate } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const addProgressUpdateProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-field/progress-updates",
		tags: ["Project Field"],
		summary: "Add a progress update",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			progress: z.number().min(0).max(100),
			phaseLabel: z.string().trim().max(100).optional(),
			note: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Add the progress update (this also updates the project's progress)
		const update = await addProgressUpdate({
			projectId: input.projectId,
			createdById: context.user.id,
			progress: input.progress,
			phaseLabel: input.phaseLabel,
			note: input.note,
		});

		return update;
	});
