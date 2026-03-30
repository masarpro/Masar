import { createOwnerAccess } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";

export const createOwnerAccessProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/owner-access",
		tags: ["Project Owner Portal"],
		summary: "Create owner access token for a project",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			label: z.string().trim().max(100).optional(),
			expiresInDays: z.number().int().min(1).max(90).optional().default(30),
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
