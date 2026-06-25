import { ORPCError } from "@orpc/client";
import {
	defaultShouldDehydrateQuery,
	QueryClient,
} from "@tanstack/react-query";

/**
 * Decide whether a failed query is worth retrying.
 *
 * The infrastructure makes transient failures common: Vercel functions in Dubai
 * talk to Supabase in Mumbai (~20-30ms/query, many queries per page), serverless
 * cold starts, pgbouncer hiccups, and ECONNRESET on Windows dev. A single such
 * blip used to turn the whole page into an empty state until a manual refresh
 * (the "sometimes it loads, sometimes it's empty, refresh fixes it" bug), because
 * retries were globally disabled.
 *
 * We retry ONLY non-deterministic failures (network errors, timeouts, 5xx). We
 * never retry deterministic client errors (4xx: BAD_REQUEST / UNAUTHORIZED /
 * FORBIDDEN / NOT_FOUND / CONFLICT / 429) — those would just fail again, delay
 * the error UI, and waste rate-limit budget (e.g. owner-portal TOKEN_REVOKED).
 */
function isRetryableError(error: unknown): boolean {
	// oRPC surfaces HTTP/handler errors as ORPCError with a numeric status.
	if (error instanceof ORPCError) {
		// 4xx = deterministic client error → never retry. 5xx / unknown → retry.
		return error.status >= 500 || error.status === 0;
	}

	// Aborted/cancelled requests must not be retried.
	if (error instanceof Error && error.name === "AbortError") {
		return false;
	}

	// Plain fetch/network failures (TypeError "Failed to fetch", ECONNRESET, etc.)
	// never reach the server → safe and worth retrying.
	return true;
}

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes default (was 60s)
				gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
				// Retry transient failures (network/5xx) up to 2 times; never retry
				// deterministic 4xx client errors. See isRetryableError above.
				retry: (failureCount, error) =>
					failureCount < 2 && isRetryableError(error),
				retryDelay: (attemptIndex) =>
					Math.min(1000 * 2 ** attemptIndex, 4000),
				refetchOnWindowFocus: false,
				refetchOnReconnect: true,
			},
			dehydrate: {
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	});
}
