import { createBaseline } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createBaselineProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-execution/baselines",
		tags: ["Project Execution"],
		summary: "Create a project baseline snapshot",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200),
			description: z.string().trim().max(2000).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		const baseline = await createBaseline(
			input.organizationId,
			input.projectId,
			input.name,
			input.description,
			context.user.id,
		);

		return { baseline };
	});
