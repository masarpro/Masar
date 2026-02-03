import { sendMessage, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const sendOfficialUpdateProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/official-update",
		tags: ["Project Owner Portal"],
		summary: "Send an official update to the owner",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			content: z.string().min(1, "محتوى التحديث مطلوب"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "edit" },
		);

		// Send official update
		const message = await sendMessage(
			input.organizationId,
			input.projectId,
			{
				channel: "OWNER",
				senderId: context.user.id,
				content: input.content,
				isUpdate: true, // Mark as official update
			},
		);

		// Log audit event
		await logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "MESSAGE_SENT",
			entityType: "official_update",
			entityId: message.id,
			metadata: { isOfficialUpdate: true },
		});

		return message;
	});
