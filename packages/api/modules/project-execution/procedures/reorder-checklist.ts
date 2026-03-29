import { ORPCError } from "@orpc/server";
import { db, reorderChecklist } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const reorderChecklistProcedure = subscriptionProcedure
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

		const checklists = await reorderChecklist(
			input.organizationId,
			input.activityId,
			input.checklistIds,
		);

		return { checklists };
	});
