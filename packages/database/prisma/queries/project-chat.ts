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

	// Each channel has its OWN lastReadAt cutoff, so a single count/groupBy
	// can't express "createdAt > <that channel's cutoff>" per channel. Instead
	// of one count query per channel on every poll, fetch the (few) messages
	// newer than the OLDEST cutoff in ONE query and apply each channel's own
	// cutoff in JS (3 round-trips per poll → 2).
	const channels: MessageChannel[] = ["TEAM", "OWNER"];
	const cutoffs = new Map<MessageChannel, Date>(
		channels.map((channel) => [
			channel,
			lastReads.find((lr) => lr.channel === channel)?.lastReadAt ??
				new Date(0),
		]),
	);
	const minCutoff = new Date(
		Math.min(...[...cutoffs.values()].map((d) => d.getTime())),
	);

	const recentMessages = await db.projectMessage.findMany({
		where: {
			organizationId,
			projectId,
			channel: { in: channels },
			createdAt: { gt: minCutoff },
			senderId: { not: userId },
		},
		select: { channel: true, createdAt: true },
	});

	let totalUnread = 0;
	for (const message of recentMessages) {
		const cutoff = cutoffs.get(message.channel);
		if (cutoff && message.createdAt > cutoff) {
			totalUnread++;
		}
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
