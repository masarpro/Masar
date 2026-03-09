/**
 * Business Event Logger
 * Logs important business events (not technical errors).
 * Console logs are always emitted for Vercel dashboard visibility.
 * Sentry breadcrumbs/events are added when Sentry is available.
 */

type BusinessEventType =
	// Subscription events
	| "subscription.limit_hit"
	| "subscription.bypass_attempt"
	| "subscription.upgraded"
	| "subscription.expired"
	// Permission events
	| "permission.denied"
	| "permission.cross_tenant"
	// Finance events
	| "finance.invoice_overdue"
	| "finance.large_transaction"
	// Security events
	| "auth.rate_limited"
	| "auth.deactivated_access"
	// Organization events
	| "org.member_added"
	| "org.member_removed"
	| "project.created"
	| "project.deleted";

type BusinessEventData = {
	type: BusinessEventType;
	userId?: string;
	organizationId?: string;
	metadata?: Record<string, unknown>;
	severity: "info" | "warning" | "error";
};

export function logBusinessEvent(event: BusinessEventData): void {
	const logFn =
		event.severity === "error"
			? console.error
			: event.severity === "warning"
				? console.warn
				: console.info;

	logFn(`[BUSINESS] ${event.type}`, {
		userId: event.userId,
		orgId: event.organizationId,
		...event.metadata,
	});

	// Sentry integration (optional — only if @sentry/nextjs is available)
	try {
		// Dynamic import to avoid hard dependency
		const Sentry = require("@sentry/nextjs");

		Sentry.addBreadcrumb({
			category: "business",
			message: event.type,
			level: event.severity,
			data: {
				userId: event.userId,
				organizationId: event.organizationId,
				...event.metadata,
			},
		});

		// For warning and error events, send as a Sentry event
		if (event.severity !== "info") {
			Sentry.captureMessage(`[Business] ${event.type}`, {
				level: event.severity,
				tags: {
					eventType: event.type,
					userId: event.userId || "unknown",
					organizationId: event.organizationId || "unknown",
				},
				extra: event.metadata,
			});
		}
	} catch {
		// Sentry not available — silent fail
	}
}
