import { createRouterClient } from "@orpc/server";
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
	context: () => Promise<{ headers: Headers }>,
) => createRouterClient(router, { context });
