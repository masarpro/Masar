import { NextResponse } from "next/server";
import { db } from "@repo/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, number> = {};

  // 1. DB ping
  const dbStart = performance.now();
  await db.$queryRaw`SELECT 1`;
  results.dbPing = Math.round(performance.now() - dbStart);

  // 2. Simple count query
  const countStart = performance.now();
  await db.organization.count();
  results.orgCount = Math.round(performance.now() - countStart);

  // 3. findFirst query
  const findStart = performance.now();
  await db.organization.findFirst({
    select: { id: true, name: true },
  });
  results.orgFindFirst = Math.round(performance.now() - findStart);

  // 4. 3 queries parallel
  const parallelStart = performance.now();
  await Promise.all([
    db.$queryRaw`SELECT 1`,
    db.organization.count(),
    db.organization.findFirst({ select: { id: true } }),
  ]);
  results.parallel3 = Math.round(performance.now() - parallelStart);

  // 5. 3 queries sequential
  const seqStart = performance.now();
  await db.$queryRaw`SELECT 1`;
  await db.organization.count();
  await db.organization.findFirst({ select: { id: true } });
  results.sequential3 = Math.round(performance.now() - seqStart);

  // 6. Vercel region info
  const region = process.env.VERCEL_REGION || "unknown (local)";

  return NextResponse.json({
    region,
    timestamp: new Date().toISOString(),
    measurements: results,
    analysis: {
      networkLatency: `~${results.dbPing}ms per DB roundtrip`,
      parallelSaving: `${results.sequential3 - results.parallel3}ms saved by parallel`,
      estimatedPageLoad: `${results.dbPing * 1}ms (1 query) to ${results.dbPing * 5}ms (5 sequential queries)`,
    },
  });
}
