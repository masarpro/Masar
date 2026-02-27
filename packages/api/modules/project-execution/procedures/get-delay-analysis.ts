import { getDelayAnalysis } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getDelayAnalysisProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/delay-analysis",
		tags: ["Project Execution"],
		summary: "Get delay analysis for the project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const delayedActivities = await getDelayAnalysis(
			input.organizationId,
			input.projectId,
		);

		return { delayedActivities };
	});
