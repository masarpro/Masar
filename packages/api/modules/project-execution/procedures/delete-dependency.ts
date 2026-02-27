import { ORPCError } from "@orpc/server";
import { deleteDependency } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteDependencyProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/project-execution/dependencies/{dependencyId}",
		tags: ["Project Execution"],
		summary: "Delete an activity dependency",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			dependencyId: z.string(),
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

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Dependency not found" });
		}
	});
