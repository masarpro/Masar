import { listDependencies } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listDependenciesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/dependencies",
		tags: ["Project Execution"],
		summary: "List activity dependencies",
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

		const dependencies = await listDependencies(
			input.organizationId,
			input.projectId,
		);

		return { dependencies };
	});
