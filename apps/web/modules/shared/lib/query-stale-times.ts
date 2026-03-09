/**
 * Centralized staleTime constants for React Query.
 *
 * Categories:
 *  - STABLE: Data that rarely changes (org settings, roles, permissions)
 *  - DEFAULT: Moderate change frequency (project lists, clients)
 *  - DYNAMIC: Frequently changing data (invoices, expenses, dashboard)
 *  - REALTIME: Always fresh (notifications, messages)
 */
export const STALE_TIMES = {
	// Almost never changes within a session — 15 min
	ORGANIZATION: 15 * 60 * 1000,
	PERMISSIONS: 15 * 60 * 1000,
	ROLES: 15 * 60 * 1000,
	FINANCE_SETTINGS: 15 * 60 * 1000,
	TEMPLATES: 15 * 60 * 1000,

	// Stable data — 5 min (matches new default)
	PROJECTS_LIST: 5 * 60 * 1000,
	EMPLOYEES: 5 * 60 * 1000,
	CLIENTS: 5 * 60 * 1000,
	BANKS: 5 * 60 * 1000,
	SUBSCRIPTION: 5 * 60 * 1000,

	// Moderately dynamic — 2 min
	PROJECT_DETAILS: 2 * 60 * 1000,
	INVOICES: 2 * 60 * 1000,
	EXPENSES: 2 * 60 * 1000,
	CLAIMS: 2 * 60 * 1000,
	DASHBOARD_STATS: 2 * 60 * 1000,

	// Fast-changing — 30s
	NOTIFICATIONS: 30 * 1000,
	MESSAGES: 30 * 1000,
	AI_CHATS: 60 * 1000,

	// Always fresh
	REALTIME: 0,
} as const;
