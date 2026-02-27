import { getLookahead } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getLookaheadProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/lookahead",
		tags: ["Project Execution"],
		summary: "Get lookahead activities for next N weeks",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			weeks: z.number().int().min(1).max(12).default(2),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const activities = await getLookahead(
			input.organizationId,
			input.projectId,
			input.weeks,
		);

		return { activities };
	});
