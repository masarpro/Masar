import { ORPCError } from "@orpc/server";
import { createChecklistItem } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createChecklistItemProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/checklists",
		tags: ["Project Execution"],
		summary: "Create a checklist item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			activityId: z.string(),
			title: z.string().min(1).max(500),
		}),
	)
	.handler(async ({ input }) => {
		try {
			const item = await createChecklistItem(
				input.organizationId,
				input.activityId,
				input.title,
			);

			return { item };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
		}
	});
