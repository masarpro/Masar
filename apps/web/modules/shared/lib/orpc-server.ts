import "server-only";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createApiServerClient } from "@repo/api/orpc/server-client";
import { headers } from "next/headers";

/**
 * Server-side oRPC caller — invokes procedures in-process instead of a
 * self-HTTP fetch to /api/rpc. Use this (not `orpc`/`orpcClient`) whenever a
 * server component calls or prefetches an RPC.
 *
 * `orpcServer.<proc>.queryOptions(...)` produces the SAME query keys as the
 * client-side `orpc` utils, so HydrationBoundary dehydration/hydration keeps
 * working unchanged — only the queryFn transport differs.
 */
export const orpcServerClient = createApiServerClient(async () => ({
	headers: await headers(),
}));

export const orpcServer = createTanstackQueryUtils(orpcServerClient);
