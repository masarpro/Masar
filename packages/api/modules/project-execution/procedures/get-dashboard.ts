import { getExecutionDashboard } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getDashboardProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/dashboard",
		tags: ["Project Execution"],
		summary: "Get execution dashboard summary",
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

		const dashboard = await getExecutionDashboard(
			input.organizationId,
			input.projectId,
		);

		return { dashboard };
	});
