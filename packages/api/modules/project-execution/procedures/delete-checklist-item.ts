import { ORPCError } from "@orpc/server";
import { db, deleteChecklistItem } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const deleteChecklistItemProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/checklists/{checklistId}",
		tags: ["Project Execution"],
		summary: "Delete a checklist item",
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
			await deleteChecklistItem(
				input.organizationId,
				input.activityId,
				input.checklistId,
			);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Checklist item not found" });
		}
	});
