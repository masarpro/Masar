// ⚠️ TEMPORARY — sandbox diagnostic endpoint, delete after testing
import { NextResponse } from "next/server";
import { testSandboxWithSampleCSR } from "@repo/api/lib/zatca/phase2/sandbox-test";

export async function GET() {
	const result = await testSandboxWithSampleCSR();
	return NextResponse.json(result);
}
