import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, sendOwnerPortalMessage, createNotifications } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { db } from "@repo/database";

export const sendOwnerMessageProcedure = publicProcedure
	.route({
		method: "POST",
		path: "/owner-portal/messages",
		tags: ["Owner Portal"],
		summary: "Send a message from owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
			content: z.string().min(1, "الرسالة مطلوبة"),
			senderName: z.string().optional().default("مالك المشروع"),
		}),
	)
	.handler(async ({ input }) => {
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Send message
		const message = await sendOwnerPortalMessage(
			context.organizationId,
			context.projectId,
			{
				content: input.content,
				senderName: input.senderName,
			},
		);

		// Notify team members about the message
		const teamMembers = await db.member.findMany({
			where: {
				organizationId: context.organizationId,
			},
			select: { userId: true },
			take: 20,
		});

		if (teamMembers.length > 0) {
			await createNotifications(
				context.organizationId,
				teamMembers.map((m) => m.userId),
				{
					type: "OWNER_MESSAGE",
					title: "رسالة من مالك المشروع",
					body: `رسالة جديدة في مشروع: ${context.project.name}`,
					projectId: context.projectId,
					entityType: "message",
					entityId: message.id,
				},
			);
		}

		return message;
	});
