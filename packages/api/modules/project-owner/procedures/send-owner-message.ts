import { sendOwnerPortalMessage } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, RATE_LIMITS } from "../../../lib/rate-limit";
import { notifyEvent } from "../../notifications/lib/notify";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const sendOwnerMessageProcedure = publicProcedure
	.route({
		method: "POST",
		path: "/owner-portal/messages",
		tags: ["Owner Portal"],
		summary: "Send a message from owner portal",
	})
	.input(
		z.object({
			token: z.string().trim().min(1).max(200).optional(),
			sessionToken: z.string().trim().min(1).max(200).optional(),
			content: z.string().trim().min(1, "الرسالة مطلوبة").max(5000),
			senderName: z.string().trim().max(100).optional().default("مالك المشروع"),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		const authKey = input.token || input.sessionToken!;
		await enforceRateLimit(`token:${authKey}:sendOwnerMessage`, RATE_LIMITS.STRICT);

		const result = await resolveOwnerContext(input);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Send message
		const message = await sendOwnerPortalMessage(
			result.organizationId,
			result.projectId,
			{
				content: input.content,
				senderName: input.senderName,
			},
		);

		// Notify project manager + org admins about the message
		await notifyEvent({
			event: "chat.ownerMessageReceived",
			organizationId: result.organizationId,
			projectId: result.projectId,
			entity: { type: "message", id: message.id },
			data: {
				projectName: result.project.name,
				preview: input.content.slice(0, 80),
			},
		});

		return message;
	});
