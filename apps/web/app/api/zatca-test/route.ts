// ⚠️ TEMPORARY — sandbox diagnostic endpoint, delete after testing
import { NextResponse } from "next/server";
import { runSandboxE2ETest } from "@repo/api/lib/zatca/phase2/sandbox-test";

export async function GET() {
	const result = await runSandboxE2ETest();
	return NextResponse.json(result);
}
