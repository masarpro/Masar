import type { SendMessageParams, SendResult, MessagingProvider } from "./types";
import { noopProvider } from "./providers/noop";
import { emailProvider } from "./providers/email";
import { whatsappProvider } from "./providers/whatsapp";
import { smsProvider } from "./providers/sms";

// ═══════════════════════════════════════════════════════════════════════════
// Unified Message Sender (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the appropriate provider for a channel
 */
function getProvider(channel: string): MessagingProvider {
	switch (channel) {
		case "EMAIL":
			return emailProvider.isConfigured() ? emailProvider : noopProvider;
		case "WHATSAPP":
			return whatsappProvider.isConfigured() ? whatsappProvider : noopProvider;
		case "SMS":
			return smsProvider.isConfigured() ? smsProvider : noopProvider;
		default:
			return noopProvider;
	}
}

/**
 * Check if a channel is properly configured
 */
export function isChannelConfigured(channel: string): boolean {
	switch (channel) {
		case "EMAIL":
			return emailProvider.isConfigured();
		case "WHATSAPP":
			return whatsappProvider.isConfigured();
		case "SMS":
			return smsProvider.isConfigured();
		default:
			return false;
	}
}

/**
 * Send a message through the appropriate channel
 */
export async function sendMessage(params: SendMessageParams): Promise<SendResult> {
	const provider = getProvider(params.channel);

	switch (params.channel) {
		case "EMAIL":
			return provider.sendEmail({
				to: params.to,
				subject: params.subject || "مسار - إشعار",
				html: params.html || params.text,
				text: params.text,
			});

		case "WHATSAPP":
			return provider.sendWhatsApp({
				to: params.to,
				templateKey: params.templateKey || "default",
				variables: params.variables || {},
				fallbackText: params.text,
			});

		case "SMS":
			return provider.sendSMS({
				to: params.to,
				text: params.text,
			});

		default:
			return {
				success: false,
				provider: "unknown",
				error: `Unknown channel: ${params.channel}`,
			};
	}
}

/**
 * Get status of all messaging providers
 */
export function getProvidersStatus(): Record<string, boolean> {
	return {
		email: emailProvider.isConfigured(),
		whatsapp: whatsappProvider.isConfigured(),
		sms: smsProvider.isConfigured(),
	};
}
