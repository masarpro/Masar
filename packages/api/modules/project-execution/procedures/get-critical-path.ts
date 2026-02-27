import { getActivityGraphForCPM } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { calculateCPM } from "../lib/cpm";

export const getCriticalPathProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/critical-path",
		tags: ["Project Execution"],
		summary: "Calculate critical path",
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

		const graph = await getActivityGraphForCPM(
			input.organizationId,
			input.projectId,
		);

		const cpmResults = calculateCPM(
			graph.nodes.map((n) => ({ id: n.id, duration: n.duration })),
			graph.edges,
		);

		return {
			nodes: graph.nodes.map((n) => {
				const cpm = cpmResults.find((r) => r.id === n.id);
				return {
					...n,
					...cpm,
				};
			}),
			edges: graph.edges,
			criticalActivities: cpmResults
				.filter((r) => r.isCritical)
				.map((r) => r.id),
		};
	});
