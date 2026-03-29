import { ORPCError } from "@orpc/server";
import { db, listChecklists } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
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
			{ section: "projects", action: "view" },
		);

		const checklists = await listChecklists(
			input.organizationId,
			input.activityId,
		);

		return { checklists };
	});
