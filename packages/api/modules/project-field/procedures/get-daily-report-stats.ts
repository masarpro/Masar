import { getDailyReportStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getDailyReportStatsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-field/daily-reports/stats",
		tags: ["Project Field"],
		summary: "Get aggregate daily report stats for a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		return await getDailyReportStats(input.projectId);
	});
