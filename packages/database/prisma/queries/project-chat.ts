import { db } from "../client";

// Type definitions for chat enums
type MessageChannel = "TEAM" | "OWNER";

// ═══════════════════════════════════════════════════════════════════════════
// Message Queries - الرسائل
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List messages for a project channel
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

	return {
		items: messages.reverse(), // Reverse to show oldest first in UI
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
 * Count unread messages for a user in a channel (messages after last visit)
 * Note: This is a simplified version. A proper implementation would track
 * user's last read timestamp per channel.
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
