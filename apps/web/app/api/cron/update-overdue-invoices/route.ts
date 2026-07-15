import { db } from "@repo/database";
import { startOfTodayRiyadhUtc } from "@repo/utils";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
	// Verify cron secret to prevent unauthorized access
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await db.financeInvoice.updateMany({
		where: {
			status: { in: ["ISSUED", "SENT", "PARTIALLY_PAID"] },
			// Only past the due date in Riyadh terms — avoids flipping invoices to
			// OVERDUE at 03:00 Riyadh on the due date itself (dueDate is @db.Date).
			dueDate: { lt: startOfTodayRiyadhUtc() },
		},
		data: { status: "OVERDUE" },
	});

	return NextResponse.json({
		success: true,
		updatedCount: result.count,
		timestamp: new Date().toISOString(),
	});
}
