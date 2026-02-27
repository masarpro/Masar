import { listBaselines } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listBaselinesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/baselines",
		tags: ["Project Execution"],
		summary: "List project baselines",
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

		const baselines = await listBaselines(
			input.organizationId,
			input.projectId,
		);

		return { baselines };
	});
