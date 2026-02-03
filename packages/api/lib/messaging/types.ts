// ═══════════════════════════════════════════════════════════════════════════
// Messaging Provider Types (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════

export type MessagingChannel = "EMAIL" | "WHATSAPP" | "SMS";

export interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export interface SendWhatsAppParams {
	to: string;
	templateKey: string;
	variables: Record<string, string>;
	fallbackText: string;
}

export interface SendSMSParams {
	to: string;
	text: string;
}

export interface SendResult {
	success: boolean;
	provider: string;
	messageId?: string;
	error?: string;
}

/**
 * Provider-agnostic messaging interface
 */
export interface MessagingProvider {
	name: string;

	sendEmail(params: SendEmailParams): Promise<SendResult>;
	sendWhatsApp(params: SendWhatsAppParams): Promise<SendResult>;
	sendSMS(params: SendSMSParams): Promise<SendResult>;

	isConfigured(): boolean;
}

/**
 * Unified message params for the send function
 */
export interface SendMessageParams {
	channel: MessagingChannel;
	to: string;
	subject?: string;
	text: string;
	html?: string;
	templateKey?: string;
	variables?: Record<string, string>;
}
