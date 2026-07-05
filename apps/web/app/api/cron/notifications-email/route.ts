import { processEmailNotificationQueue } from "@repo/api/modules/notifications/lib/email-queue";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Cron: تفريغ طابور بريد الإشعارات (EMAIL/PENDING → Resend → SENT/FAILED)
 * يُسجَّل في المجدول الخارجي كل 5 دقائق — نفس نمط بقية crons.
 */
export async function GET(request: Request) {
	// Verify cron secret to prevent unauthorized access
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await processEmailNotificationQueue(50);

		return NextResponse.json({
			success: true,
			...result,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Cron:NotificationsEmail] Failed:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
