import { ORPCError } from "@orpc/server";
import { deleteBaseline } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const deleteBaselineProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/baselines/{baselineId}",
		tags: ["Project Execution"],
		summary: "Delete a baseline",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			baselineId: z.string().trim().max(100),
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
