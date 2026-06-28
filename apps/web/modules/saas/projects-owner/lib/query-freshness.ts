/**
 * Owner portal read queries must reflect contractor-side project changes
 * (start/end dates, milestones, payments, photos, messages) reasonably quickly
 * — NOT only after the global 5-minute cache window.
 *
 * Balance: a short 30s freshness window keeps data current on return-to-tab and
 * after navigating away and back, WITHOUT the refetch storm that
 * `staleTime:0 + refetchOnMount:"always"` caused — that re-fetched every query
 * on every single mount/focus, making owner-portal navigation feel slow. With a
 * 30s staleTime, intra-portal navigation reads cache, while `refetchOnWindowFocus`
 * still refreshes once the data is older than 30s.
 *
 * Spread this into each owner-portal `queryOptions({ input, ...OWNER_QUERY_FRESHNESS })`.
 */
export const OWNER_QUERY_FRESHNESS = {
	staleTime: 30 * 1000,
	refetchOnWindowFocus: true as const,
} as const;
