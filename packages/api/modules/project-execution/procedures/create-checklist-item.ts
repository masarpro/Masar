import { ORPCError } from "@orpc/server";
import { createChecklistItem, db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createChecklistItemProcedure = subscriptionProcedure
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
