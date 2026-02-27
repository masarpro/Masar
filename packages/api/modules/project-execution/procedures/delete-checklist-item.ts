import { ORPCError } from "@orpc/server";
import { deleteChecklistItem } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteChecklistItemProcedure = protectedProcedure
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
	.handler(async ({ input }) => {
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
