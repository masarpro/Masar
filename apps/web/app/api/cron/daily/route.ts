import { db } from "@repo/database";
import { generateDueRecurringEntries } from "@repo/database/prisma/queries/accounting";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
	// Verify cron secret to prevent unauthorized access
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const results: Record<string, unknown> = {};

	// 1. Generate recurring journal entries for all organizations
	try {
		const organizations = await db.organization.findMany({
			select: { id: true },
		});

		let totalGenerated = 0;
		for (const org of organizations) {
			// Get an admin user for this organization to use as the creator
			const admin = await db.member.findFirst({
				where: { organizationId: org.id, role: "owner" },
				select: { userId: true },
			});

			if (admin) {
				const { generated } = await generateDueRecurringEntries(
					db,
					org.id,
					admin.userId,
				);
				totalGenerated += generated;
			}
		}
		results.recurringEntries = { generated: totalGenerated, orgs: organizations.length };
	} catch (err) {
		console.error("[Cron:Daily] Recurring entries failed:", err);
		results.recurringEntries = { error: "failed" };
	}

	// 2. Cleanup old read notifications (>90 days)
	try {
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

		const deleted = await db.notification.deleteMany({
			where: {
				readAt: { not: null, lt: ninetyDaysAgo },
			},
		});
		results.notificationCleanup = { deleted: deleted.count };
	} catch (err) {
		console.error("[Cron:Daily] Notification cleanup failed:", err);
		results.notificationCleanup = { error: "failed" };
	}

	// 3. Cleanup very old notifications (>180 days, even unread)
	try {
		const oneEightyDaysAgo = new Date();
		oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

		const deleted = await db.notification.deleteMany({
			where: {
				createdAt: { lt: oneEightyDaysAgo },
			},
		});
		results.oldNotificationCleanup = { deleted: deleted.count };
	} catch (err) {
		console.error("[Cron:Daily] Old notification cleanup failed:", err);
		results.oldNotificationCleanup = { error: "failed" };
	}

	return NextResponse.json({
		success: true,
		results,
		timestamp: new Date().toISOString(),
	});
}
