import { db, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const renewOwnerAccessProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/owner-access/{accessId}/renew",
		tags: ["Project Owner Portal"],
		summary: "Renew an owner access token expiry",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			accessId: z.string(),
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

		// Verify the access belongs to this project and is not revoked
		const access = await db.projectOwnerAccess.findFirst({
			where: {
				id: input.accessId,
				organizationId: input.organizationId,
				projectId: input.projectId,
				isRevoked: false,
			},
		});

		if (!access) {
			throw new ORPCError("NOT_FOUND", {
				message: "رابط الوصول غير موجود أو تم إلغاؤه",
			});
		}

		// Calculate new expiry from now
		const newExpiresAt = new Date();
		newExpiresAt.setDate(newExpiresAt.getDate() + input.expiresInDays);

		const updated = await db.projectOwnerAccess.update({
			where: { id: input.accessId },
			data: { expiresAt: newExpiresAt },
			include: {
				createdBy: { select: { id: true, name: true } },
			},
		});

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "TOKEN_CREATED",
			entityType: "token",
			entityId: input.accessId,
			metadata: { action: "renewed", expiresInDays: input.expiresInDays },
		});

		return updated;
	});
