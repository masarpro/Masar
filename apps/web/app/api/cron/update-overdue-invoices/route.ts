import { db } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	// Verify cron secret to prevent unauthorized access
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await db.financeInvoice.updateMany({
		where: {
			status: { in: ["ISSUED", "SENT", "PARTIALLY_PAID"] },
			dueDate: { lt: new Date() },
		},
		data: { status: "OVERDUE" },
	});

	return NextResponse.json({
		success: true,
		updatedCount: result.count,
		timestamp: new Date().toISOString(),
	});
}
