import { listOwnerAccesses } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listOwnerAccessProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/owner-access",
		tags: ["Project Owner Portal"],
		summary: "List owner access tokens for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		const accesses = await listOwnerAccesses(
			input.organizationId,
			input.projectId,
		);

		return accesses;
	});
