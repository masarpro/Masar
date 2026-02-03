import { ORPCError } from "@orpc/server";
import {
	getIntegrationSettings,
	logMessageDelivery,
	updateMessageDeliveryStatus,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { sendMessage, isChannelConfigured } from "../../../lib/messaging/send";
import type { MessagingChannel } from "../../../lib/messaging/types";

export const sendMessageProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/integrations/send",
		tags: ["Integrations"],
		summary: "Send a message through configured channels",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
			recipient: z.string(),
			subject: z.string().optional(),
			text: z.string(),
			html: z.string().optional(),
			templateKey: z.string().optional(),
			variables: z.record(z.string()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
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
			variables: input.variables,
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

export const sendBulkMessages = protectedProcedure
	.route({
		method: "POST",
		path: "/integrations/send-bulk",
		tags: ["Integrations"],
		summary: "Send messages to multiple recipients",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
			recipients: z.array(z.string()).min(1).max(50),
			subject: z.string().optional(),
			text: z.string(),
			html: z.string().optional(),
			templateKey: z.string().optional(),
			variables: z.record(z.string()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
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
					variables: input.variables,
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
