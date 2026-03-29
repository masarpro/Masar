import { ORPCError } from "@orpc/server";
import { db, toggleChecklistItem } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const toggleChecklistItemProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/project-execution/checklists/{checklistId}/toggle",
		tags: ["Project Execution"],
		summary: "Toggle a checklist item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			activityId: z.string(),
			checklistId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const activity = await db.projectActivity.findFirst({
			where: { id: input.activityId, organizationId: input.organizationId },
			select: { projectId: true },
		});
		if (!activity) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}

		await verifyProjectAccess(
			activity.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		try {
			const item = await toggleChecklistItem(
				input.organizationId,
				input.activityId,
				input.checklistId,
				context.user.id,
			);

			return { item };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Checklist item not found" });
		}
	});
