import { createOwnerAccess } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const createOwnerAccessProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/owner-access",
		tags: ["Project Owner Portal"],
		summary: "Create owner access token for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			label: z.string().optional(),
			expiresInDays: z.number().int().positive().max(365).optional().default(90),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		await enforceFeatureAccess(input.organizationId, "owner-portal.activate", context.user);

		// Create owner access
		const access = await createOwnerAccess(
			input.organizationId,
			input.projectId,
			{
				createdById: context.user.id,
				label: input.label,
				expiresInDays: input.expiresInDays,
			},
		);

		return access;
	});
