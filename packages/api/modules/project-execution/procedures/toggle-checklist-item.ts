import { ORPCError } from "@orpc/server";
import { toggleChecklistItem } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const toggleChecklistItemProcedure = protectedProcedure
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
