import { cleanupExpiredTokens } from "@repo/database";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
	// Verify cron secret to prevent unauthorized access
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await cleanupExpiredTokens();

	return NextResponse.json({
		success: true,
		...result,
		timestamp: new Date().toISOString(),
	});
}
