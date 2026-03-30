import { ORPCError } from "@orpc/server";
import {
	getIntegrationSettings,
	logMessageDelivery,
	updateMessageDeliveryStatus,
} from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { sendMessage, isChannelConfigured } from "../../../lib/messaging/send";
import type { MessagingChannel } from "../../../lib/messaging/types";

export const sendMessageProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/integrations/send",
		tags: ["Integrations"],
		summary: "Send a message through configured channels",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100).optional(),
			channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
			recipient: z.string().trim().max(254),
			subject: z.string().trim().max(500).optional(),
			text: z.string().trim().max(5000),
			html: z.string().max(50000).optional(),
			templateKey: z.string().trim().max(200).optional(),
			variables: z.record(z.string().max(100), z.string().max(2000)).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Message rate limit (30/min)
		const { rateLimitChecker, RATE_LIMITS } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "integrations.sendMessage", RATE_LIMITS.MESSAGE);

		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "integrations" },
		);

		// Get organization integration settings
		const settings = await getIntegrationSettings(input.organizationId);

		// Check if channel is enabled for this organization
		const channelEnabled = {
			EMAIL: settings.emailEnabled,
			WHATSAPP: settings.whatsappEnabled,
			SMS: settings.smsEnabled,
		}[input.channel];

		if (!channelEnabled) {
			throw new ORPCError("BAD_REQUEST", {
				message: `${input.channel} channel is not enabled for this organization`,
			});
		}

		// Check if provider is configured
		if (!isChannelConfigured(input.channel)) {
			throw new ORPCError("BAD_REQUEST", {
				message: `${input.channel} provider is not configured`,
			});
		}

		// Log the message attempt
		const deliveryLog = await logMessageDelivery({
			organizationId: input.organizationId,
			projectId: input.projectId,
			channel: input.channel as MessagingChannel,
			recipient: input.recipient,
			subject: input.subject,
			content: input.text,
			status: "PENDING",
			sentById: context.user.id,
		});

		// Send the message
		const result = await sendMessage({
			channel: input.channel as MessagingChannel,
			to: input.recipient,
			subject: input.subject,
			text: input.text,
			html: input.html,
			templateKey: input.templateKey,
			variables: input.variables as Record<string, string> | undefined,
		});

		// Update delivery status
		await updateMessageDeliveryStatus(
			deliveryLog.id,
			result.success ? "SENT" : "FAILED",
			result.error,
		);

		return {
			success: result.success,
			messageId: result.messageId,
			provider: result.provider,
			error: result.error,
		};
	});

export const sendBulkMessages = subscriptionProcedure
	.route({
		method: "POST",
		path: "/integrations/send-bulk",
		tags: ["Integrations"],
		summary: "Send messages to multiple recipients",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100).optional(),
			channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
			recipients: z.array(z.string().trim().max(254)).min(1).max(50),
			subject: z.string().trim().max(500).optional(),
			text: z.string().trim().max(5000),
			html: z.string().max(50000).optional(),
			templateKey: z.string().trim().max(200).optional(),
			variables: z.record(z.string().max(100), z.string().max(2000)).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Strict rate limit for bulk messages (5/min)
		const { rateLimitChecker, RATE_LIMITS } = await import("../../../lib/rate-limit");
		await rateLimitChecker(context.user.id, "integrations.sendBulkMessages", RATE_LIMITS.STRICT);

		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "integrations" },
		);

		// Get organization integration settings
		const settings = await getIntegrationSettings(input.organizationId);

		// Check if channel is enabled
		const channelEnabled = {
			EMAIL: settings.emailEnabled,
			WHATSAPP: settings.whatsappEnabled,
			SMS: settings.smsEnabled,
		}[input.channel];

		if (!channelEnabled) {
			throw new ORPCError("BAD_REQUEST", {
				message: `${input.channel} channel is not enabled for this organization`,
			});
		}

		// Check if provider is configured
		if (!isChannelConfigured(input.channel)) {
			throw new ORPCError("BAD_REQUEST", {
				message: `${input.channel} provider is not configured`,
			});
		}

		// Send to all recipients
		const results = await Promise.all(
			input.recipients.map(async (recipient) => {
				// Log the message attempt
				const deliveryLog = await logMessageDelivery({
					organizationId: input.organizationId,
					projectId: input.projectId,
					channel: input.channel as MessagingChannel,
					recipient,
					subject: input.subject,
					content: input.text,
					status: "PENDING",
					sentById: context.user.id,
				});

				// Send the message
				const result = await sendMessage({
					channel: input.channel as MessagingChannel,
					to: recipient,
					subject: input.subject,
					text: input.text,
					html: input.html,
					templateKey: input.templateKey,
					variables: input.variables as Record<string, string> | undefined,
				});

				// Update delivery status
				await updateMessageDeliveryStatus(
					deliveryLog.id,
					result.success ? "SENT" : "FAILED",
					result.error,
				);

				return {
					recipient,
					success: result.success,
					messageId: result.messageId,
					error: result.error,
				};
			}),
		);

		const successCount = results.filter((r) => r.success).length;
		const failedCount = results.filter((r) => !r.success).length;

		return {
			total: results.length,
			success: successCount,
			failed: failedCount,
			results,
		};
	});
