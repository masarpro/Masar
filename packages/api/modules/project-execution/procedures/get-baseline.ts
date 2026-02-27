import { ORPCError } from "@orpc/server";
import { getBaseline } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getBaselineProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/baselines/{baselineId}",
		tags: ["Project Execution"],
		summary: "Get a specific baseline with snapshot data",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			baselineId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const baseline = await getBaseline(
			input.organizationId,
			input.projectId,
			input.baselineId,
		);

		if (!baseline) {
			throw new ORPCError("NOT_FOUND", { message: "Baseline not found" });
		}

		return { baseline };
	});
