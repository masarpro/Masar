import { ORPCError } from "@orpc/server";
import { setActiveBaseline } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const setActiveBaselineProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/project-execution/baselines/{baselineId}/activate",
		tags: ["Project Execution"],
		summary: "Set a baseline as the active baseline",
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
			{ section: "projects", action: "edit" },
		);

		try {
			await setActiveBaseline(
				input.organizationId,
				input.projectId,
				input.baselineId,
			);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Baseline not found" });
		}
	});
