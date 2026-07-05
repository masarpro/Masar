/**
 * طابور بريد الإشعارات
 * =====================
 * صفوف Notification بقناة EMAIL تُكتب بحالة PENDING من notifyEvent،
 * وهذه الدالة تفرغها — تُستدعى من cron:
 *   GET /api/cron/notifications-email (كل 5 دقائق عبر المجدول الخارجي)
 *
 * لماذا طابور وليس إرسال فوري؟ على Vercel serverless أي عمل بعد إرجاع
 * الاستجابة قد يتجمد — الإرسال الفوري fire-and-forget كان يضيع صامتاً.
 * الطابور يعطي إعادة محاولة + حالة FAILED مرئية.
 */
import {
	db,
	getPendingEmailNotifications,
	markEmailFailed,
	markEmailSent,
} from "@repo/database";
import { isChannelConfigured, sendMessage } from "../../../lib/messaging/send";

const STALE_PENDING_HOURS = 24;

function buildEmailHtml(title: string, body?: string | null): string {
	return `<div dir="rtl" style="font-family: sans-serif; padding: 20px;">
	<h2 style="color: #1a1a1a;">${title}</h2>
	${body ? `<p style="color: #555; font-size: 15px;">${body}</p>` : ""}
	<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
	<p style="color: #999; font-size: 12px;">منصة مسار — app-masar.com</p>
</div>`;
}

export interface EmailQueueResult {
	processed: number;
	sent: number;
	failed: number;
	sweptStale: number;
	emailConfigured: boolean;
}

/**
 * تفريغ دفعة من طابور البريد + كنس PENDING الأقدم من 24 ساعة إلى FAILED
 * (كي لا يتراكم فهرس [channel, deliveryStatus] إلى الأبد).
 */
export async function processEmailNotificationQueue(
	limit = 50,
): Promise<EmailQueueResult> {
	// 1. كنس العالق
	const staleCutoff = new Date(
		Date.now() - STALE_PENDING_HOURS * 60 * 60 * 1000,
	);
	const swept = await db.notification.updateMany({
		where: {
			channel: "EMAIL",
			deliveryStatus: "PENDING",
			createdAt: { lt: staleCutoff },
		},
		data: { deliveryStatus: "FAILED" },
	});

	const emailConfigured = isChannelConfigured("EMAIL");
	if (!emailConfigured) {
		// لا مزود بريد — نترك الصفوف PENDING (سيكنسها فحص الـ24 ساعة)
		return {
			processed: 0,
			sent: 0,
			failed: 0,
			sweptStale: swept.count,
			emailConfigured: false,
		};
	}

	// 2. إرسال الدفعة
	const pending = await getPendingEmailNotifications(limit);
	let sent = 0;
	let failed = 0;

	for (const notification of pending) {
		try {
			const email = notification.user?.email;
			if (!email) {
				throw new Error("recipient has no email address");
			}
			const result = await sendMessage({
				channel: "EMAIL",
				to: email,
				subject: notification.title,
				text: notification.body ?? notification.title,
				html: buildEmailHtml(notification.title, notification.body),
			});
			if (!result.success) {
				throw new Error(result.error ?? `provider ${result.provider} failed`);
			}
			await markEmailSent(notification.id);
			sent++;
		} catch (error) {
			await markEmailFailed(
				notification.id,
				error instanceof Error ? error.message : String(error),
			).catch(() => {});
			failed++;
		}
	}

	return {
		processed: pending.length,
		sent,
		failed,
		sweptStale: swept.count,
		emailConfigured: true,
	};
}
