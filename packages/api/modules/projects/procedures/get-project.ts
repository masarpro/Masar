import { ORPCError } from "@orpc/server";
import { getProjectById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getProject = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{id}",
		tags: ["Projects"],
		summary: "Get a project by ID",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission
		await verifyProjectAccess(
			input.id,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		// Fetch full project details
		const project = await getProjectById(input.id, input.organizationId);

		if (!project) {
			throw new ORPCError("NOT_FOUND", {
				message: "المشروع غير موجود",
			});
		}

		return {
			...project,
			contractValue: project.contractValue
				? Number(project.contractValue)
				: null,
			progress: Number(project.progress),
		};
	});
