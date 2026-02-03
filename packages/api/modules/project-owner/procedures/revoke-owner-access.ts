import { revokeOwnerAccess, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const revokeOwnerAccessProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/owner-access/{accessId}/revoke",
		tags: ["Project Owner Portal"],
		summary: "Revoke an owner access token",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			accessId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		// Revoke access
		const access = await revokeOwnerAccess(
			input.organizationId,
			input.projectId,
			input.accessId,
		);

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "APPROVAL_DECIDED", // Using existing action type
			entityType: "owner_access",
			entityId: input.accessId,
			metadata: { action: "revoked" },
		});

		return { success: true, access };
	});
