import { db } from "../client";
import type { MessagingChannel, MessageDeliveryStatus } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// Integration Settings & Message Delivery Queries (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get integration settings for an organization
 */
export async function getIntegrationSettings(organizationId: string) {
	let settings = await db.organizationIntegrationSettings.findUnique({
		where: { organizationId },
	});

	// Create default settings if not exists
	if (!settings) {
		settings = await db.organizationIntegrationSettings.create({
			data: {
				organizationId,
				emailEnabled: true,
				whatsappEnabled: false,
				smsEnabled: false,
				defaultChannel: "EMAIL",
				ownerNotifyOnOfficialUpdate: true,
				ownerNotifyOnPaymentDue: true,
			},
		});
	}

	return settings;
}

/**
 * Update integration settings
 */
export async function updateIntegrationSettings(
	organizationId: string,
	data: {
		emailEnabled?: boolean;
		whatsappEnabled?: boolean;
		smsEnabled?: boolean;
		defaultChannel?: MessagingChannel;
		ownerNotifyOnOfficialUpdate?: boolean;
		ownerNotifyOnPaymentDue?: boolean;
	},
) {
	return db.organizationIntegrationSettings.upsert({
		where: { organizationId },
		create: {
			organizationId,
			...data,
		},
		update: data,
	});
}

/**
 * Log a message delivery
 */
export async function logMessageDelivery(data: {
	organizationId: string;
	projectId?: string;
	channel: MessagingChannel;
	recipient: string;
	subject?: string;
	content?: string;
	status: MessageDeliveryStatus;
	provider?: string;
	errorMessage?: string;
	sentById?: string;
}) {
	return db.messageDeliveryLog.create({
		data,
	});
}

/**
 * Update message delivery status
 */
export async function updateMessageDeliveryStatus(
	id: string,
	status: MessageDeliveryStatus,
	errorMessage?: string,
) {
	return db.messageDeliveryLog.update({
		where: { id },
		data: {
			status,
			errorMessage,
		},
	});
}

/**
 * Get message delivery logs for an organization
 */
export async function getMessageDeliveryLogs(
	organizationId: string,
	options?: {
		projectId?: string;
		channel?: MessagingChannel;
		status?: MessageDeliveryStatus;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		projectId?: string;
		channel?: MessagingChannel;
		status?: MessageDeliveryStatus;
	} = { organizationId };

	if (options?.projectId) where.projectId = options.projectId;
	if (options?.channel) where.channel = options.channel;
	if (options?.status) where.status = options.status;

	const [logs, total] = await Promise.all([
		db.messageDeliveryLog.findMany({
			where,
			include: {
				project: { select: { id: true, name: true } },
				sentBy: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.messageDeliveryLog.count({ where }),
	]);

	return { logs, total };
}
