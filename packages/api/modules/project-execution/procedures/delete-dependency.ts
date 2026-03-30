import { ORPCError } from "@orpc/server";
import { deleteDependency } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { invalidateCPMCache } from "../lib/cpm-cache";

export const deleteDependencyProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/dependencies/{dependencyId}",
		tags: ["Project Execution"],
		summary: "Delete an activity dependency",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			dependencyId: z.string().trim().max(100),
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
			await deleteDependency(
				input.organizationId,
				input.projectId,
				input.dependencyId,
			);

			invalidateCPMCache(input.projectId);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Dependency not found" });
		}
	});
