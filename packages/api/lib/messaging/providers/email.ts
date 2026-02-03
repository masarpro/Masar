import type {
	MessagingProvider,
	SendEmailParams,
	SendWhatsAppParams,
	SendSMSParams,
	SendResult,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// Email Provider - Uses existing mail package (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Email provider that wraps the existing @repo/mail package
 */
export class EmailProvider implements MessagingProvider {
	name = "email";

	async sendEmail(params: SendEmailParams): Promise<SendResult> {
		try {
			// Dynamic import to avoid circular dependencies
			const { sendEmail } = await import("@repo/mail");

			const success = await sendEmail({
				to: params.to,
				subject: params.subject,
				html: params.html,
				text: params.text,
			});

			return {
				success,
				provider: this.name,
				messageId: success ? `email-${Date.now()}` : undefined,
				error: success ? undefined : "Failed to send email",
			};
		} catch (error) {
			return {
				success: false,
				provider: this.name,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async sendWhatsApp(_params: SendWhatsAppParams): Promise<SendResult> {
		// Email provider doesn't support WhatsApp
		return {
			success: false,
			provider: this.name,
			error: "WhatsApp not supported by email provider",
		};
	}

	async sendSMS(_params: SendSMSParams): Promise<SendResult> {
		// Email provider doesn't support SMS
		return {
			success: false,
			provider: this.name,
			error: "SMS not supported by email provider",
		};
	}

	isConfigured(): boolean {
		// Check if email is configured via env vars
		return !!(
			process.env.RESEND_API_KEY ||
			process.env.POSTMARK_API_KEY ||
			process.env.PLUNK_API_KEY ||
			process.env.MAILGUN_API_KEY ||
			process.env.SMTP_HOST
		);
	}
}

export const emailProvider = new EmailProvider();
