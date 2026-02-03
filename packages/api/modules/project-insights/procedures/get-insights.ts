import { getProjectById, getProjectInsights } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getInsights = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/:projectId/insights",
		tags: ["Project Insights"],
		summary: "Get smart alerts and insights for a project",
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

		const [project, insights] = await Promise.all([
			getProjectById(input.projectId, input.organizationId),
			getProjectInsights(input.organizationId, input.projectId),
		]);

		return {
			project: project ? {
				id: project.id,
				name: project.name,
				progress: project.progress,
			} : null,
			activeAlerts: insights.activeAlerts,
			acknowledgedAlerts: insights.acknowledgedAlerts,
			stats: insights.stats,
		};
	});
