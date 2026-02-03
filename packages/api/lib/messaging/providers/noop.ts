import type {
	MessagingProvider,
	SendEmailParams,
	SendWhatsAppParams,
	SendSMSParams,
	SendResult,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// NOOP Provider - Does nothing, used as default (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NOOP provider - logs messages but doesn't actually send anything
 * Used as fallback when no provider is configured
 */
export class NoopProvider implements MessagingProvider {
	name = "noop";

	async sendEmail(params: SendEmailParams): Promise<SendResult> {
		console.log(`[NOOP] Email to ${params.to}: ${params.subject}`);
		return {
			success: true,
			provider: this.name,
			messageId: `noop-email-${Date.now()}`,
		};
	}

	async sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult> {
		console.log(
			`[NOOP] WhatsApp to ${params.to}: ${params.templateKey} - ${params.fallbackText}`,
		);
		return {
			success: true,
			provider: this.name,
			messageId: `noop-whatsapp-${Date.now()}`,
		};
	}

	async sendSMS(params: SendSMSParams): Promise<SendResult> {
		console.log(`[NOOP] SMS to ${params.to}: ${params.text}`);
		return {
			success: true,
			provider: this.name,
			messageId: `noop-sms-${Date.now()}`,
		};
	}

	isConfigured(): boolean {
		// NOOP is always "configured" as it's the fallback
		return true;
	}
}

export const noopProvider = new NoopProvider();
