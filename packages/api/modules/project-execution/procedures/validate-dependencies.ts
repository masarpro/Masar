import { detectCycles } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const validateDependenciesProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/project-execution/dependencies/validate",
		tags: ["Project Execution"],
		summary: "Validate if a dependency would create a cycle",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			predecessorId: z.string(),
			successorId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const hasCycle = await detectCycles(
			input.organizationId,
			input.projectId,
			input.predecessorId,
			input.successorId,
		);

		return { valid: !hasCycle, hasCycle };
	});
