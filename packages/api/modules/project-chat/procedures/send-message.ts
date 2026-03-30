import {
	sendMessage,
	createNotifications,
	logAuditEvent,
	linkAttachmentsToOwner,
	db,
} from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const MessageChannelEnum = z.enum(["TEAM", "OWNER"]);

export const sendMessageProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/chat",
		tags: ["Project Chat"],
		summary: "Send a message to a project channel",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			channel: MessageChannelEnum,
			content: z.string().trim().min(1, "الرسالة مطلوبة").max(5000),
			isUpdate: z.boolean().optional().default(false),
			attachmentIds: z.array(z.string().trim().max(100)).max(1000).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Message rate limit (30/min)
		const { rateLimitChecker, RATE_LIMITS } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "project-chat.sendMessage", RATE_LIMITS.MESSAGE);

		const { project } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		// OWNER channel access is already verified by verifyProjectAccess above

		// Send message
		const message = await sendMessage(
			input.organizationId,
			input.projectId,
			{
				channel: input.channel,
				senderId: context.user.id,
				content: input.content,
				isUpdate: input.isUpdate,
			},
		);

		// Link attachments to message if provided
		if (input.attachmentIds?.length) {
			await linkAttachmentsToOwner(
				input.organizationId,
				input.attachmentIds,
				"MESSAGE",
				message.id,
			);
		}

		// Log audit event for OWNER channel messages
		if (input.channel === "OWNER") {
			await logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "MESSAGE_SENT",
				entityType: "message",
				entityId: message.id,
				metadata: {
					channel: input.channel,
					isUpdate: input.isUpdate,
				},
			});

			// If it's an official update, notify relevant team members
			if (input.isUpdate) {
				// Get project managers to notify
				const teamMembers = await db.member.findMany({
					where: {
						organizationId: input.organizationId,
						userId: { not: context.user.id },
					},
					select: { userId: true },
					take: 20, // Limit notifications
				});

				if (teamMembers.length > 0) {
					await createNotifications(
						input.organizationId,
						teamMembers.map((m) => m.userId),
						{
							type: "OWNER_MESSAGE",
							title: "تحديث رسمي جديد",
							body: `تحديث رسمي في مشروع: ${project.name}`,
							projectId: input.projectId,
							entityType: "message",
							entityId: message.id,
						},
					);
				}
			}
		}

		return message;
	});
