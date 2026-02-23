import { db } from "../client";

// Type definitions for chat enums
type MessageChannel = "TEAM" | "OWNER";

// ═══════════════════════════════════════════════════════════════════════════
// Message Queries - الرسائل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List messages for a project channel (with attachments)
 */
export async function listMessages(
	organizationId: string,
	projectId: string,
	channel: MessageChannel,
	options?: {
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 50;
	const skip = (page - 1) * pageSize;

	const where = {
		organizationId,
		projectId,
		channel,
	};

	const [messages, total] = await Promise.all([
		db.projectMessage.findMany({
			where,
			include: {
				sender: { select: { id: true, name: true, image: true } },
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.projectMessage.count({ where }),
	]);

	// Batch-fetch attachments for these messages
	const messageIds = messages.map((m) => m.id);
	const attachments =
		messageIds.length > 0
			? await db.attachment.findMany({
					where: {
						ownerType: "MESSAGE",
						ownerId: { in: messageIds },
					},
					orderBy: { createdAt: "asc" },
				})
			: [];

	// Map attachments to messages
	const attachmentMap = new Map<string, typeof attachments>();
	for (const att of attachments) {
		const existing = attachmentMap.get(att.ownerId) || [];
		existing.push(att);
		attachmentMap.set(att.ownerId, existing);
	}

	const messagesWithAttachments = messages.reverse().map((m) => ({
		...m,
		attachments: attachmentMap.get(m.id) || [],
	}));

	return {
		items: messagesWithAttachments,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * Send a message to a project channel
 */
export async function sendMessage(
	organizationId: string,
	projectId: string,
	data: {
		channel: MessageChannel;
		senderId: string;
		content: string;
		isUpdate?: boolean;
	},
) {
	return db.projectMessage.create({
		data: {
			organizationId,
			projectId,
			channel: data.channel,
			senderId: data.senderId,
			content: data.content,
			isUpdate: data.isUpdate ?? false,
		},
		include: {
			sender: { select: { id: true, name: true, image: true } },
		},
	});
}

/**
 * Get official updates (isUpdate = true) for OWNER channel
 */
export async function getOfficialUpdates(
	organizationId: string,
	projectId: string,
	options?: {
		limit?: number;
	},
) {
	return db.projectMessage.findMany({
		where: {
			organizationId,
			projectId,
			channel: "OWNER",
			isUpdate: true,
		},
		include: {
			sender: { select: { id: true, name: true, image: true } },
		},
		orderBy: { createdAt: "desc" },
		take: options?.limit ?? 10,
	});
}

/**
 * Get the latest message in a channel
 */
export async function getLatestMessage(
	organizationId: string,
	projectId: string,
	channel: MessageChannel,
) {
	return db.projectMessage.findFirst({
		where: {
			organizationId,
			projectId,
			channel,
		},
		include: {
			sender: { select: { id: true, name: true, image: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Count total messages in a channel
 */
export async function countChannelMessages(
	organizationId: string,
	projectId: string,
	channel: MessageChannel,
) {
	return db.projectMessage.count({
		where: {
			organizationId,
			projectId,
			channel,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Unread Tracking - تتبع الرسائل غير المقروءة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get unread message count for a user across all channels in a project
 */
export async function getUnreadChatCount(
	organizationId: string,
	projectId: string,
	userId: string,
) {
	const lastReads = await db.chatLastRead.findMany({
		where: { organizationId, projectId, userId },
	});

	const channels: MessageChannel[] = ["TEAM", "OWNER"];
	let totalUnread = 0;

	for (const channel of channels) {
		const lastRead = lastReads.find((lr) => lr.channel === channel);
		const lastReadAt = lastRead?.lastReadAt ?? new Date(0);

		const count = await db.projectMessage.count({
			where: {
				organizationId,
				projectId,
				channel,
				createdAt: { gt: lastReadAt },
				senderId: { not: userId },
			},
		});
		totalUnread += count;
	}

	return totalUnread;
}

/**
 * Mark a channel as read for a user
 */
export async function markChannelAsRead(
	organizationId: string,
	projectId: string,
	userId: string,
	channel: MessageChannel,
) {
	return db.chatLastRead.upsert({
		where: {
			projectId_userId_channel: { projectId, userId, channel },
		},
		update: { lastReadAt: new Date(), organizationId },
		create: {
			organizationId,
			projectId,
			userId,
			channel,
			lastReadAt: new Date(),
		},
	});
}
