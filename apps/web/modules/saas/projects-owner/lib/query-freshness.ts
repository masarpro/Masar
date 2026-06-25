/**
 * Owner portal read queries must reflect contractor-side project changes
 * (start/end dates, milestones, payments, photos, messages) as soon as the
 * owner opens, navigates to, or returns to the page — NOT after the global
 * 5-minute cache window. Without this the owner keeps seeing stale data (e.g.
 * old project dates) until a hard refresh.
 *
 * Spread this into each owner-portal `queryOptions({ input, ...OWNER_QUERY_FRESHNESS })`
 * call: it marks the query always-stale and refetches on mount and on window
 * focus (when the owner switches back to the tab).
 */
export const OWNER_QUERY_FRESHNESS = {
	staleTime: 0,
	refetchOnMount: "always" as const,
	refetchOnWindowFocus: true as const,
} as const;
