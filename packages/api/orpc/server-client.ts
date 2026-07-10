import { createRouterClient } from "@orpc/server";
import type { auth } from "@repo/auth";
import { router } from "./router";

/**
 * In-process caller for the oRPC router.
 *
 * Runs the exact same procedure chain (session check, rate limit,
 * verifyOrganizationAccess, …) as an HTTP request to /api/rpc, but without
 * the self-HTTP round trip (TLS + proxy + re-serialization) that server
 * components previously paid when prefetching through the fetch-based
 * orpcClient.
 *
 * The context factory is provided by the caller so this package stays free
 * of framework imports (Next.js supplies `headers()` from apps/web).
 */
export const createApiServerClient = (
	context: () => Promise<{
		headers: Headers;
		/** Marks the call as server-originated — skips the per-call rate limiter. */
		isInternal?: boolean;
		/** Request-deduped session so each prefetch skips cookie re-verification. */
		resolvedSession?: Awaited<ReturnType<typeof auth.api.getSession>>;
	}>,
) => createRouterClient(router, { context });
