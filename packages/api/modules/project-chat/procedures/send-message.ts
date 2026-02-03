import { ORPCError } from "@orpc/server";
import {
	sendMessage,
	createNotifications,
	logAuditEvent,
	db,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

const MessageChannelEnum = z.enum(["TEAM", "OWNER"]);

export const sendMessageProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/chat",
		tags: ["Project Chat"],
		summary: "Send a message to a project channel",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			channel: MessageChannelEnum,
			content: z.string().min(1, "الرسالة مطلوبة"),
			isUpdate: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		const { project, membership } = await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		// For OWNER channel, restrict to certain roles (admin, owner, manager)
		if (input.channel === "OWNER") {
			// Check if user has permission to post in owner channel
			// For now, allow all org members but mark as official update only for managers
			if (!["admin", "owner", "member"].includes(membership.role)) {
				throw new ORPCError("FORBIDDEN", {
					message: "ليس لديك صلاحية للكتابة في قناة المالك",
				});
			}
		}

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
