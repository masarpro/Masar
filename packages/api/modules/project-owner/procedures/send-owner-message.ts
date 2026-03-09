import { sendOwnerPortalMessage, createNotifications } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { db } from "@repo/database";
import { enforceRateLimit, RATE_LIMITS } from "../../../lib/rate-limit";
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
			token: z.string().min(1).optional(),
			sessionToken: z.string().min(1).optional(),
			content: z.string().min(1, "الرسالة مطلوبة"),
			senderName: z.string().optional().default("مالك المشروع"),
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

		// Notify team members about the message
		const teamMembers = await db.member.findMany({
			where: {
				organizationId: result.organizationId,
			},
			select: { userId: true },
			take: 20,
		});

		if (teamMembers.length > 0) {
			await createNotifications(
				result.organizationId,
				teamMembers.map((m) => m.userId),
				{
					type: "OWNER_MESSAGE",
					title: "رسالة من مالك المشروع",
					body: `رسالة جديدة في مشروع: ${result.project.name}`,
					projectId: result.projectId,
					entityType: "message",
					entityId: message.id,
				},
			);
		}

		return message;
	});
