import { ORPCError } from "@orpc/server";
import { createDependency } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createDependencyProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/project-execution/dependencies",
		tags: ["Project Execution"],
		summary: "Create an activity dependency",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			predecessorId: z.string().trim().max(100),
			successorId: z.string().trim().max(100),
			dependencyType: z.enum(["FINISH_TO_START", "START_TO_START", "FINISH_TO_FINISH", "START_TO_FINISH"]).optional(),
			lagDays: z.number().int().optional(),
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
			const dependency = await createDependency(
				input.organizationId,
				input.projectId,
				{
					predecessorId: input.predecessorId,
					successorId: input.successorId,
					dependencyType: input.dependencyType,
					lagDays: input.lagDays,
				},
			);

			return { dependency };
		} catch (error: any) {
			if (error.message?.includes("cycle")) {
				throw new ORPCError("BAD_REQUEST", { message: "Adding this dependency would create a cycle" });
			}
			throw new ORPCError("BAD_REQUEST", { message: error.message ?? "Failed to create dependency" });
		}
	});
