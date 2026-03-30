import type {
	MessagingProvider,
	SendEmailParams,
	SendWhatsAppParams,
	SendSMSParams,
	SendResult,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// WhatsApp Provider Stub (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WhatsApp provider stub
 * In production, this would integrate with WhatsApp Business API (Meta)
 * or a provider like Twilio, MessageBird, etc.
 */
export class WhatsAppProvider implements MessagingProvider {
	name = "whatsapp";

	async sendEmail(_params: SendEmailParams): Promise<SendResult> {
		return {
			success: false,
			provider: this.name,
			error: "Email not supported by WhatsApp provider",
		};
	}

	async sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult> {
		// TODO: Implement actual WhatsApp integration
		// This is a stub that would be replaced with actual API calls
		// to WhatsApp Business API or Twilio WhatsApp

		if (!this.isConfigured()) {
			return {
				success: false,
				provider: this.name,
				error: "WhatsApp provider not configured",
			};
		}

		console.debug(`[WhatsApp STUB] Sending to ${params.to}:`);
		console.debug(`  Template: ${params.templateKey}`);
		console.debug(`  Variables: ${JSON.stringify(params.variables)}`);
		console.debug(`  Fallback: ${params.fallbackText}`);

		// Simulate success for now
		return {
			success: true,
			provider: this.name,
			messageId: `whatsapp-stub-${Date.now()}`,
		};
	}

	async sendSMS(_params: SendSMSParams): Promise<SendResult> {
		return {
			success: false,
			provider: this.name,
			error: "SMS not supported by WhatsApp provider",
		};
	}

	isConfigured(): boolean {
		// Check for WhatsApp-specific env vars
		return !!(
			process.env.WHATSAPP_BUSINESS_ID ||
			process.env.TWILIO_WHATSAPP_NUMBER
		);
	}
}

export const whatsappProvider = new WhatsAppProvider();
