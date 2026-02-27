import { ORPCError } from "@orpc/server";
import { deleteBaseline } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteBaselineProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/baselines/{baselineId}",
		tags: ["Project Execution"],
		summary: "Delete a baseline",
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
			await deleteBaseline(
				input.organizationId,
				input.projectId,
				input.baselineId,
			);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Baseline not found" });
		}
	});
