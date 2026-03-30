/**
 * Notification Email Dispatch
 * Sends notification emails via the messaging system (Resend).
 * Fire-and-forget — errors are logged but never block the caller.
 */

import { sendMessage, isChannelConfigured } from "../../../lib/messaging/send";

/**
 * Send a notification email to a single recipient.
 * Returns silently on failure (fire-and-forget pattern).
 */
export async function sendNotificationEmail(
	to: string,
	title: string,
	body?: string,
): Promise<void> {
	if (!isChannelConfigured("EMAIL")) return;

	try {
		await sendMessage({
			channel: "EMAIL",
			to,
			subject: title,
			text: body ?? title,
			html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px;">
				<h2 style="color: #1a1a1a;">${title}</h2>
				${body ? `<p style="color: #555; font-size: 15px;">${body}</p>` : ""}
				<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
				<p style="color: #999; font-size: 12px;">منصة مسار — app-masar.com</p>
			</div>`,
		});
	} catch (err) {
		console.error("[Notification:Email] Failed to send:", to, err);
	}
}

/**
 * Send notification emails to multiple recipients.
 * All sends are fire-and-forget.
 */
export async function sendNotificationEmails(
	recipients: Array<{ email: string }>,
	title: string,
	body?: string,
): Promise<void> {
	if (!isChannelConfigured("EMAIL") || recipients.length === 0) return;

	for (const recipient of recipients) {
		sendNotificationEmail(recipient.email, title, body).catch(() => {});
	}
}
