import { db } from "../client";
import type {
	NotificationType,
	NotificationChannel,
	DeliveryStatus,
	Prisma,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Notification Queries - الإشعارات (Phase 6 Enhanced)
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateNotificationInput {
	type: NotificationType;
	title: string;
	body?: string;
	projectId?: string;
	entityType?: string;
	entityId?: string;
	channel?: NotificationChannel;
	dedupeKey?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Create notifications for multiple users (with deduplication)
 */
export async function createNotifications(
	organizationId: string,
	userIds: string[],
	data: CreateNotificationInput,
) {
	// If dedupeKey provided, check for existing
	if (data.dedupeKey) {
		const existing = await db.notification.findUnique({
			where: { dedupeKey: data.dedupeKey },
		});
		if (existing) {
			return { count: 0, skipped: true };
		}
	}

	return db.notification.createMany({
		data: userIds.map((userId, index) => ({
			organizationId,
			userId,
			type: data.type,
			title: data.title,
			body: data.body,
			projectId: data.projectId,
			entityType: data.entityType,
			entityId: data.entityId,
			channel: data.channel ?? "IN_APP",
			deliveryStatus: data.channel === "EMAIL" ? "PENDING" : "SENT",
			// Only first notification gets the dedupeKey
			dedupeKey: index === 0 ? data.dedupeKey : undefined,
			metadata: data.metadata as Prisma.InputJsonValue,
		})),
	});
}

/**
 * Create a single notification (with deduplication)
 */
export async function createNotification(
	organizationId: string,
	userId: string,
	data: CreateNotificationInput,
) {
	// If dedupeKey provided, check for existing
	if (data.dedupeKey) {
		const existing = await db.notification.findUnique({
			where: { dedupeKey: data.dedupeKey },
		});
		if (existing) {
			return existing;
		}
	}

	return db.notification.create({
		data: {
			organizationId,
			userId,
			type: data.type,
			title: data.title,
			body: data.body,
			projectId: data.projectId,
			entityType: data.entityType,
			entityId: data.entityId,
			channel: data.channel ?? "IN_APP",
			deliveryStatus: data.channel === "EMAIL" ? "PENDING" : "SENT",
			dedupeKey: data.dedupeKey,
			metadata: data.metadata as Prisma.InputJsonValue,
		},
	});
}

/**
 * Create notification with email channel
 */
export async function createEmailNotification(
	organizationId: string,
	userId: string,
	data: Omit<CreateNotificationInput, "channel">,
) {
	return createNotification(organizationId, userId, {
		...data,
		channel: "EMAIL",
	});
}

/**
 * List notifications for a user
 */
export async function listNotifications(
	organizationId: string,
	userId: string,
	options?: {
		unreadOnly?: boolean;
		channel?: NotificationChannel;
		page?: number;
		pageSize?: number;
	},
) {
	const page = options?.page ?? 1;
	const pageSize = options?.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where: Prisma.NotificationWhereInput = {
		organizationId,
		userId,
		// Only show IN_APP notifications in the list (email notifications are separate)
		channel: options?.channel ?? "IN_APP",
	};

	if (options?.unreadOnly) {
		where.readAt = null;
	}

	const [notifications, total, unreadCount] = await Promise.all([
		db.notification.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.notification.count({ where }),
		db.notification.count({
			where: { organizationId, userId, readAt: null, channel: "IN_APP" },
		}),
	]);

	return {
		items: notifications,
		total,
		unreadCount,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize),
	};
}

/**
 * Mark notifications as read
 */
export async function markNotificationsRead(
	organizationId: string,
	userId: string,
	notificationIds: string[],
) {
	return db.notification.updateMany({
		where: {
			organizationId,
			userId,
			id: { in: notificationIds },
			readAt: null,
		},
		data: {
			readAt: new Date(),
		},
	});
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(
	organizationId: string,
	userId: string,
) {
	return db.notification.updateMany({
		where: {
			organizationId,
			userId,
			readAt: null,
			channel: "IN_APP",
		},
		data: {
			readAt: new Date(),
		},
	});
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
	organizationId: string,
	userId: string,
) {
	return db.notification.count({
		where: {
			organizationId,
			userId,
			readAt: null,
			channel: "IN_APP",
		},
	});
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(
	organizationId: string,
	daysOld: number = 30,
) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);

	return db.notification.deleteMany({
		where: {
			organizationId,
			readAt: { not: null },
			createdAt: { lt: cutoffDate },
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Email Delivery Functions (Phase 6)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get pending email notifications for sending
 */
export async function getPendingEmailNotifications(limit: number = 50) {
	return db.notification.findMany({
		where: {
			channel: "EMAIL",
			deliveryStatus: "PENDING",
		},
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
		},
		orderBy: { createdAt: "asc" },
		take: limit,
	});
}

/**
 * Mark email notification as sent
 */
export async function markEmailSent(notificationId: string) {
	return db.notification.update({
		where: { id: notificationId },
		data: {
			deliveryStatus: "SENT",
			sentAt: new Date(),
		},
	});
}

/**
 * Mark email notification as failed
 */
export async function markEmailFailed(
	notificationId: string,
	error?: string,
) {
	return db.notification.update({
		where: { id: notificationId },
		data: {
			deliveryStatus: "FAILED",
			metadata: error ? { error } : undefined,
		},
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// Notification Helper (Phase 6)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a dedupe key for notifications
 * Format: {type}:{entityType}:{entityId}:{timestamp_minute}
 */
export function generateDedupeKey(
	type: NotificationType,
	entityType: string,
	entityId: string,
): string {
	// Round to minute to allow dedupe within same minute
	const minuteTimestamp = Math.floor(Date.now() / 60000);
	return `${type}:${entityType}:${entityId}:${minuteTimestamp}`;
}

/**
 * Notify project managers/admins of an event
 * Uses the new RBAC system (Role model) instead of Member.role
 */
export async function notifyProjectManagers(
	organizationId: string,
	projectId: string,
	data: CreateNotificationInput,
) {
	const { getOrganizationAdminUserIds } = await import("./permissions");
	const userIds = await getOrganizationAdminUserIds(organizationId);

	if (userIds.length === 0) return { count: 0 };

	return createNotifications(organizationId, userIds, {
		...data,
		projectId,
	});
}
