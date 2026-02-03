import type {
	MessagingProvider,
	SendEmailParams,
	SendWhatsAppParams,
	SendSMSParams,
	SendResult,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// SMS Provider Stub (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SMS provider stub
 * In production, this would integrate with SMS providers like
 * Twilio, Vonage, MessageBird, or local Saudi providers like Yamamah
 */
export class SMSProvider implements MessagingProvider {
	name = "sms";

	async sendEmail(_params: SendEmailParams): Promise<SendResult> {
		return {
			success: false,
			provider: this.name,
			error: "Email not supported by SMS provider",
		};
	}

	async sendWhatsApp(_params: SendWhatsAppParams): Promise<SendResult> {
		return {
			success: false,
			provider: this.name,
			error: "WhatsApp not supported by SMS provider",
		};
	}

	async sendSMS(params: SendSMSParams): Promise<SendResult> {
		// TODO: Implement actual SMS integration
		// This is a stub that would be replaced with actual API calls
		// to Twilio, Vonage, or local Saudi providers

		if (!this.isConfigured()) {
			return {
				success: false,
				provider: this.name,
				error: "SMS provider not configured",
			};
		}

		console.log(`[SMS STUB] Sending to ${params.to}:`);
		console.log(`  Message: ${params.text}`);

		// Simulate success for now
		return {
			success: true,
			provider: this.name,
			messageId: `sms-stub-${Date.now()}`,
		};
	}

	isConfigured(): boolean {
		// Check for SMS-specific env vars
		return !!(
			process.env.TWILIO_ACCOUNT_SID ||
			process.env.VONAGE_API_KEY ||
			process.env.SMS_PROVIDER_KEY
		);
	}
}

export const smsProvider = new SMSProvider();
