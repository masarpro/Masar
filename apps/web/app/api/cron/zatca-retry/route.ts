import { db } from "@repo/database";
import { retryFailedSubmissions } from "@repo/api/lib/zatca/phase2";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function GET(request: Request) {
	// Verify cron secret
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await retryFailedSubmissions(db);

		return NextResponse.json({
			success: true,
			...result,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Cron:ZATCA-Retry] Failed:", error);
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
