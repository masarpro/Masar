import { reorderChecklist } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const reorderChecklistProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/checklists/reorder",
		tags: ["Project Execution"],
		summary: "Reorder checklist items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			activityId: z.string(),
			checklistIds: z.array(z.string()),
		}),
	)
	.handler(async ({ input }) => {
		const checklists = await reorderChecklist(
			input.organizationId,
			input.activityId,
			input.checklistIds,
		);

		return { checklists };
	});
