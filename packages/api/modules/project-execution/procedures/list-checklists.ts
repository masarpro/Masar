import { listChecklists } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listChecklistsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/checklists",
		tags: ["Project Execution"],
		summary: "List checklist items for an activity",
	})
	.input(
		z.object({
			organizationId: z.string(),
			activityId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		const checklists = await listChecklists(
			input.organizationId,
			input.activityId,
		);

		return { checklists };
	});
