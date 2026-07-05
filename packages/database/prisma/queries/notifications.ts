import { db } from "../client";
import type { NotificationChannel, Prisma } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Notification Queries - الإشعارات (Phase 6 Enhanced)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Batch-create notification rows (the notifyEvent pipeline).
 * Each row carries its own per-user dedupeKey; unique-constraint conflicts
 * are silently skipped so double-fired events never duplicate or throw.
 */
export interface NotificationRowInput {
	organizationId: string;
	userId: string;
	/** registry event key ("finance.invoiceIssued") or legacy enum value */
	type: string;
	title: string;
	body?: string;
	projectId?: string;
	entityType?: string;
	entityId?: string;
	channel: NotificationChannel;
	dedupeKey?: string;
	metadata?: Record<string, unknown>;
}

export async function createNotificationRows(rows: NotificationRowInput[]) {
	if (rows.length === 0) {
		return { count: 0 };
	}
	return db.notification.createMany({
		data: rows.map((r) => ({
			organizationId: r.organizationId,
			userId: r.userId,
			type: r.type,
			title: r.title,
			body: r.body,
			projectId: r.projectId,
			entityType: r.entityType,
			entityId: r.entityId,
			channel: r.channel,
			// EMAIL rows queue as PENDING and are drained by the notifications-email cron
			deliveryStatus: r.channel === "EMAIL" ? "PENDING" : "SENT",
			dedupeKey: r.dedupeKey,
			metadata: r.metadata as Prisma.InputJsonValue,
		})),
		skipDuplicates: true,
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
		/** فلترة بمفاتيح أحداث محددة (فلتر الوحدة في الواجهة) */
		types?: string[];
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

	if (options?.types && options.types.length > 0) {
		where.type = { in: options.types };
	}

	const unreadWhere: Prisma.NotificationWhereInput = {
		organizationId,
		userId,
		readAt: null,
		channel: "IN_APP",
	};

	const [notifications, total, unreadCount] = await Promise.all([
		db.notification.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: pageSize,
		}),
		db.notification.count({ where }),
		db.notification.count({ where: unreadWhere }),
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

